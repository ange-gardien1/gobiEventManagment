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
  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

  try {
    cached.promise =
      cached.promise ||
      (mongoose.connect(MONGODB_URI, {
        dbName: "gobi",
        bufferCommands: false,
      }) as unknown as Promise<Connection>);

    cached.conn = await cached.promise;
    globalWithMongoose.mongoose = cached;

    console.log("Successfully connected to MongoDB");
    return cached.conn;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    cached.conn = null; // Clear the cached connection on error
    cached.promise = null; // Clear the cached promise on error
    throw error; // Propagate the error up
  }
};
