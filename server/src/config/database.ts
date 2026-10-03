import dns from 'dns';
import mongoose from 'mongoose';

// Fail fast instead of queueing queries for 10s while disconnected
mongoose.set('bufferCommands', false);

/** Public resolvers used when the local network's DNS refuses the SRV lookup mongodb+srv:// needs */
const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1'];

const isSrvLookupError = (err: unknown) => /querySrv|ENOTFOUND|ECONNREFUSED|ETIMEOUT|ESERVFAIL/i.test(String((err as Error)?.message));

/** Explains common Atlas failures in plain words (never prints the connection string) */
const explain = (err: unknown): string => {
  const message = String((err as Error)?.message || err);
  if (/bad auth|authentication failed/i.test(message)) {
    return 'authentication failed: check the username/password in MONGODB_URI (Atlas → Database Access; URL-encode special characters in the password)';
  }
  if (/IP.*whitelist|not authorized|ReplicaSetNoPrimary|Server selection timed out/i.test(message)) {
    return 'could not reach the cluster: allow this machine in Atlas → Network Access (0.0.0.0/0 for cloud hosting)';
  }
  return message;
};

/**
 * MongoDB Atlas Connection Configuration
 * Connects to MongoDB Atlas if MONGODB_URI is set, or falls back to the built-in dataset.
 * If the local DNS blocks the SRV lookup, retries once through public DNS.
 */
export const connectDatabase = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI not provided. Server will run with local schemes memory store.');
    return false;
  }

  // Atlas connection strings usually have no database name, which would put everything in "test"
  const dbName = process.env.MONGODB_DB || 'goodbridge';
  const attempt = () => mongoose.connect(mongoUri, { dbName, serverSelectionTimeoutMS: 8000 });
  try {
    try {
      await attempt();
    } catch (err) {
      if (!mongoUri.startsWith('mongodb+srv://') || !isSrvLookupError(err)) throw err;
      console.warn('⚠️ DNS lookup for MongoDB failed on this network; retrying through public DNS');
      dns.setServers(PUBLIC_DNS);
      await attempt();
    }
    console.log(`✅ Connected to MongoDB Atlas (database: ${mongoose.connection.name})`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', explain(error));
    console.warn('⚠️ Server continuing in local schemes mode.');
    return false;
  }
};

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;
