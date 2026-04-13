import { MongoClient, Db, type Document } from "mongodb";
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "sports_ecommerce";

if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

const mongoUri = uri;

let client: MongoClient | null = null;
let clientPromiseInternal: Promise<MongoClient> | null = null;

export function getMongoClientPromise(): Promise<MongoClient> {
  if (!clientPromiseInternal) {
    client = new MongoClient(mongoUri);
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
  if (mongoose.connections[0].readyState) {
    return;
  }
  await mongoose.connect(mongoUri, {
    dbName,
  });
}

// For @auth/mongodb-adapter
const clientPromise = getMongoClientPromise();
export default clientPromise;
