import mongoose from 'mongoose';

/**
 * MongoDB Atlas Connection Configuration
 * Connects to MongoDB Atlas if MONGODB_URI is set,
 * or gracefully falls back to local dataset mode.
 */
export const connectDatabase = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI not provided. Server will run with local verified schemes memory store.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Successfully connected to MongoDB Atlas Database!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    console.warn('⚠️ Server continuing in local verified schemes mode.');
    return false;
  }
};
