import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://whoisdomainRPaco:UvBGlp8KOJEWjuRa@domainwhoisrp.bt0xapj.mongodb.net/?retryWrites=true&w=majority&appName=DomainWhoisRP';
const MONGODB_DB = 'domain_info';

// Check if the MongoDB URI is defined
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Check if the MongoDB DB is defined
if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: { conn: MongoConnection | null; promise: Promise<MongoConnection> | null } = global.mongoConnection || { conn: null, promise: null };

if (!cached) {
  cached = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI)
      .then((client) => {
        return {
          client,
          db: client.db(MONGODB_DB),
        };
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Define the global type
declare global {
  // eslint-disable-next-line no-var
  var mongoConnection: { conn: MongoConnection | null; promise: Promise<MongoConnection> | null };
}

// Set the global connection
global.mongoConnection = cached;

export default connectToDatabase; 