import { MongoClient, Db, type Document } from "mongodb";
import mongoose from 'mongoose';

const dbName = process.env.MONGODB_DB_NAME || "sports_ecommerce";

// During the Next.js build phase, MONGODB_URI may not be available.
// We defer the URI check to actual connection time so the build can complete.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }
  return uri;
}

let client: MongoClient | null = null;
let clientPromiseInternal: Promise<MongoClient> | null = null;

export function getMongoClientPromise(): Promise<MongoClient> {
  if (isBuildPhase) {
    // Return a promise that will never resolve during build — callers
    // should not actually await this during the build phase.
    return Promise.reject(new Error("MongoDB is not available during build phase"));
  }
  if (!clientPromiseInternal) {
    client = new MongoClient(getUri(), {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    clientPromiseInternal = client.connect();
  }
  return clientPromiseInternal;
}

export async function getMongoClient(): Promise<MongoClient> {
  return getMongoClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

export async function getCollection<TSchema extends Document = Document>(name: string) {
  const db = await getDb();
  return db.collection<TSchema>(name);
}

// Mongoose connection
export async function connectToDatabase() {
  if (isBuildPhase) {
    return;
  }
  if (mongoose.connections[0].readyState) {
    return;
  }
  await mongoose.connect(getUri(), {
    dbName,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
}

// For @auth/mongodb-adapter — lazily resolved so the module can be imported
// during build without throwing.
const clientPromise: Promise<MongoClient> = isBuildPhase
  ? Promise.reject(new Error("MongoDB is not available during build phase"))
  : getMongoClientPromise();

// Prevent unhandled rejection warnings for the build-phase stub.
clientPromise.catch(() => {});

export default clientPromise;
