import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface CachedConnection {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: CachedConnection;
};

const cached: CachedConnection = globalWithMongoose.mongoose || {
  conn: null,
  promise: null,
};

export const connectToDatabase = async (): Promise<Connection> => {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

  cached.promise =
    cached.promise ||
    (mongoose.connect(MONGODB_URI, {
      dbName: "gobi",
      bufferCommands: false,
    }) as unknown as Promise<Connection>);

  cached.conn = await cached.promise;
  globalWithMongoose.mongoose = cached;

  return cached.conn;
};
