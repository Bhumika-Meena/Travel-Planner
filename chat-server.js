const dns = require('dns');
try {
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
} catch (e) {}

// Load environment variables if available
const fs = require('fs');
const path = require('path');
if (process.loadEnvFile) {
  try {
    process.loadEnvFile(path.join(__dirname, '.env'));
  } catch (e) {}
} else {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = (match[2] || '').trim().replace(/(^['"]|['"]$)/g, '');
        }
      });
    }
  } catch (e) {}
}

// Require a strong JWT_SECRET just like the main app; fail startup if missing/weak
const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('[FATAL] JWT_SECRET environment variable is missing. Chat server cannot start.');
  process.exit(1);
}

if (isProd && jwtSecret.length < 32) {
  console.error('[FATAL] JWT_SECRET must be at least 32 characters in production. Chat server cannot start.');
  process.exit(1);
}

if (jwtSecret.length < 16) {
  console.error('[FATAL] JWT_SECRET is too weak (minimum 16 characters required). Chat server cannot start.');
  process.exit(1);
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { jwtVerify } = require('jose');
const { MongoClient } = require('mongodb');

const FRONTEND_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const MONGODB_DB = process.env.MONGODB_DB || 'travel_planner';

const app = express();
app.use(cors({ 
  origin: FRONTEND_ORIGIN,
  credentials: true 
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB Connection for Chat Persistence
let dbInstance = null;
async function getDb() {
  if (dbInstance) return dbInstance;
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) return null;

  let uri = rawUri;
  if (uri.includes('cluster0.q9regdz.mongodb.net')) {
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@/);
    if (match) {
      const user = encodeURIComponent(decodeURIComponent(match[1]));
      const pass = encodeURIComponent(decodeURIComponent(match[2]));
      uri = `mongodb://${user}:${pass}@ac-axlvfbf-shard-00-00.q9regdz.mongodb.net:27017,ac-axlvfbf-shard-00-01.q9regdz.mongodb.net:27017,ac-axlvfbf-shard-00-02.q9regdz.mongodb.net:27017/${MONGODB_DB}?ssl=true&replicaSet=atlas-qc4g00-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }

  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    dbInstance = client.db(MONGODB_DB);
    console.log(`Chat server successfully connected to MongoDB database: "${MONGODB_DB}"`);
    return dbInstance;
  } catch (err) {
    console.warn('Chat server MongoDB connection fallback warning:', err.message);
    return null;
  }
}

// In-memory backup store if MongoDB is offline
const memoryStore = {};

async function saveChatMessage(msg) {
  const room = [msg.senderId, msg.receiverId].sort().join('-');
  if (!memoryStore[room]) memoryStore[room] = [];
  memoryStore[room].push(msg);
  if (memoryStore[room].length > 100) memoryStore[room].shift();

  try {
    const db = await getDb();
    if (db) {
      await db.collection('messages').insertOne({
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        senderName: msg.senderName,
        timestamp: msg.timestamp,
        createdAt: new Date(msg.timestamp)
      });
    }
  } catch (err) {
    console.error('Error persisting message to MongoDB:', err);
  }
}

async function getChatHistory(userA, userB, limit = 50, before = null) {
  const room = [userA, userB].sort().join('-');
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  try {
    const db = await getDb();
    if (db) {
      const query = {
        $or: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA }
        ]
      };
      if (before) {
        const beforeDate = new Date(before);
        if (!isNaN(beforeDate.getTime())) {
          query.createdAt = { $lt: beforeDate };
        }
      }
      const docs = await db.collection('messages')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .toArray();

      if (docs.length > 0) {
        return docs.reverse().map(d => ({
          _id: d._id.toString(),
          senderId: d.senderId,
          receiverId: d.receiverId,
          content: d.content,
          timestamp: d.timestamp || d.createdAt.toISOString(),
          senderName: d.senderName || 'Traveler'
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching chat history from MongoDB:', err);
  }

  const inMem = memoryStore[room] || [];
  return inMem.slice(-safeLimit);
}

// Socket.IO Handshake Authentication Middleware
io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    // Check cookie if token not in handshake auth
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [key, val] = cookie.trim().split('=');
        if (key === 'auth_token' && val) {
          token = decodeURIComponent(val);
          break;
        }
      }
    }

    // Check authorization header
    if (!token && socket.handshake.headers.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts[0] === 'Bearer' && parts[1]) {
        token = parts[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication failed: Missing token'));
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);
    if (!payload || !payload.userId) {
      return next(new Error('Authentication failed: Invalid token payload'));
    }

    socket.user = {
      userId: String(payload.userId),
      email: payload.email,
      fullName: payload.fullName || ''
    };

    next();
  } catch (err) {
    console.warn('Socket connection rejected:', err.message);
    next(new Error('Authentication failed: ' + err.message));
  }
});

io.on('connection', (socket) => {
  const authUserId = socket.user.userId;

  // Join a room for the user pair or for personal notifications
  socket.on('joinRoom', async ({ userId, otherUserId }) => {
    // Prevent room access / spoofing: requester must be part of the conversation
    if (userId && userId !== authUserId) {
      return socket.emit('error', 'Unauthorized: Cannot join room as another user');
    }

    if (authUserId && otherUserId) {
      const room = [authUserId, otherUserId].sort().join('-');
      socket.join(room);

      // Load persistent chat history (latest 50 messages)
      const history = await getChatHistory(authUserId, otherUserId, 50);
      socket.emit('chatHistory', history);
    } else if (authUserId && !otherUserId) {
      socket.join(`user-${authUserId}`);
    }
  });

  // Handle paginated message retrieval
  socket.on('loadMoreMessages', async ({ otherUserId, before, limit }) => {
    if (!otherUserId) return;
    const history = await getChatHistory(authUserId, otherUserId, limit || 30, before);
    socket.emit('moreChatHistory', { otherUserId, history });
  });

  // Handle sending a message with content validation and sender enforcement
  socket.on('sendMessage', async (msg) => {
    if (!msg || typeof msg !== 'object') return;

    // Sender identity strictly enforced from authenticated socket
    const senderId = authUserId;
    const receiverId = typeof msg.receiverId === 'string' ? msg.receiverId : null;
    const rawContent = typeof msg.content === 'string' ? msg.content.trim() : '';

    if (!receiverId || !rawContent) return;

    // Limit message length to 2000 characters
    if (rawContent.length > 2000) {
      return socket.emit('error', 'Message length exceeds 2000 character limit');
    }

    const validatedMsg = {
      senderId,
      receiverId,
      content: rawContent,
      timestamp: new Date().toISOString(),
      senderName: socket.user.fullName || msg.senderName || 'Traveler'
    };

    await saveChatMessage(validatedMsg);

    const room = [senderId, receiverId].sort().join('-');
    io.to(room).emit('receiveMessage', validatedMsg);
    io.to(`user-${receiverId}`).emit('receiveMessage', validatedMsg);
  });

  socket.on('disconnect', () => {
    // Clean disconnection
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Hardened Socket.IO chat server running on port ${PORT}`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Handles SIGTERM (Render deploy/shutdown) and SIGINT (Ctrl+C in dev)

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[chat-server] Received ${signal}. Starting graceful shutdown…`);

  // 1. Stop accepting new HTTP connections
  server.close(() => {
    console.log('[chat-server] HTTP server closed.');
  });

  // 2. Close all active Socket.IO connections
  io.close(() => {
    console.log('[chat-server] Socket.IO server closed.');
  });

  // 3. Close MongoDB connection
  if (dbInstance) {
    try {
      // dbInstance is the Db object; get its client to close cleanly
      await dbInstance.client.close(false);
      console.log('[chat-server] MongoDB connection closed.');
    } catch (mongoErr) {
      console.warn('[chat-server] Error closing MongoDB connection:', mongoErr.message);
    }
  }

  console.log('[chat-server] Shutdown complete.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Handle unexpected errors without crashing (log and keep running)
process.on('uncaughtException', (err) => {
  console.error('[chat-server] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[chat-server] Unhandled rejection:', reason);
});