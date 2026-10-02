import { MongoClient } from 'mongodb';
import dns from 'dns';

// Fix for Node.js DNS resolution timeout on Windows/local networks querying MongoDB SRV TXT records
try {
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
} catch {
  // Graceful fallback if environment restricts setServers
}

import { validateEnvironment } from '@/lib/env';

// Startup environment validation
const envCheck = validateEnvironment();
if (envCheck.errors.length > 0) {
  console.error('[Configuration Error]:', envCheck.errors.join('; '));
}

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

function resolveDirectMongoUri(rawUri: string): string {
  if (rawUri.startsWith('mongodb+srv://') && rawUri.includes('cluster0.q9regdz.mongodb.net')) {
    const authMatch = rawUri.match(/^mongodb\+srv:\/\/([^@]+)@cluster0\.q9regdz\.mongodb\.net/);
    if (authMatch) {
      const auth = authMatch[1];
      const db = process.env.MONGODB_DB || 'travel_planner';
      return `mongodb://${auth}@ac-axlvfbf-shard-00-00.q9regdz.mongodb.net:27017,ac-axlvfbf-shard-00-01.q9regdz.mongodb.net:27017,ac-axlvfbf-shard-00-02.q9regdz.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-qc4g00-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }
  return rawUri;
}

const uri = resolveDirectMongoUri(process.env.MONGODB_URI);
const defaultDb = process.env.MONGODB_DB || 'travel_planner';
const options = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoClientUri?: string;
  };

  if (!globalWithMongo._mongoClientPromise || globalWithMongo._mongoClientUri !== uri) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientUri = uri;
    globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
      delete globalWithMongo._mongoClientPromise;
      delete globalWithMongo._mongoClientUri;
      throw err;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

let indexesCreated = false;

export async function ensureDatabaseIndexes(db: any) {
  if (indexesCreated || process.env.NODE_ENV === 'test') return;
  indexesCreated = true;
  try {
    await Promise.allSettled([
      db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
      db.collection('users').createIndex({ isVerified: 1, points: -1 }),
      db.collection('users').createIndex({ points: -1 }),
      db.collection('trips').createIndex({ userId: 1, status: 1, createdAt: -1 }),
      db.collection('otps').createIndex({ email: 1 }),
      db.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('messages').createIndex({ senderId: 1, receiverId: 1, createdAt: -1 }),
      db.collection('messages').createIndex({ receiverId: 1, senderId: 1, createdAt: -1 }),
    ]);
  } catch (err) {
    // Indexes might already exist or user lacks index privileges; ignore in production
  }
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(defaultDb);
  if (!indexesCreated && process.env.NODE_ENV !== 'test') {
    ensureDatabaseIndexes(db).catch(() => {});
  }
  return { client, db };
} 

export default connectToDatabase;