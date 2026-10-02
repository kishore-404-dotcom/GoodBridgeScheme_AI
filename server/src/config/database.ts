import mongoose from 'mongoose';

// Fail fast instead of queueing queries for 10s while disconnected
mongoose.set('bufferCommands', false);

/**
 * MongoDB Atlas Connection Configuration
 * Connects to MongoDB Atlas if MONGODB_URI is set,
 * or gracefully falls back to local dataset mode.
 */
export const connectDatabase = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI not provided. Server will run with local schemes memory store.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Successfully connected to MongoDB Atlas Database!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', (error as Error).message);
    console.warn('⚠️ Server continuing in local schemes mode.');
    return false;
  }
};

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;
