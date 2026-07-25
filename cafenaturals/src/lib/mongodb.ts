import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local or .env'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, isOffline: false, lastAttempt: 0 };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // If marked offline recently (within last 30 seconds), fail immediately to trigger mock fallback instantly
  if (cached.isOffline && Date.now() - cached.lastAttempt < 30000) {
    throw new Error('Database is offline (cached attempt)');
  }

  cached.lastAttempt = Date.now();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 1000, // 1 second timeout
      connectTimeoutMS: 1000
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        cached.isOffline = false;
        return mongooseInstance;
      })
      .catch((err) => {
        cached.isOffline = true;
        cached.promise = null;
        throw err;
      });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.isOffline = true;
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
