const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ 
  origin: process.env.NEXT_PUBLIC_APP_URL || '*',
  credentials: true 
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory message store (for demo only)
const messages = {};

io.on('connection', (socket) => {
  // Join a room for the user pair or for notifications
  socket.on('joinRoom', ({ userId, otherUserId }) => {
    if (userId && otherUserId) {
      const room = [userId, otherUserId].sort().join('-');
      socket.join(room);
      // Send chat history
      socket.emit('chatHistory', messages[room] || []);
    }
    // Join a personal notification room
    if (userId && !otherUserId) {
      socket.join(`user-${userId}`);
    }
  });

  // Handle sending a message
  socket.on('sendMessage', (msg) => {
    const room = [msg.senderId, msg.receiverId].sort().join('-');
    if (!messages[room]) messages[room] = [];
    messages[room].push(msg);
    io.to(room).emit('receiveMessage', msg);
    // Also emit to the receiver's personal notification room
    io.to(`user-${msg.receiverId}`).emit('receiveMessage', {
      ...msg,
      senderName: msg.senderName || msg.senderId // fallback if name not provided
    });
  });

  socket.on('disconnect', () => {
    // Handle disconnect if needed
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO chat server running on port ${PORT}`);
}); 