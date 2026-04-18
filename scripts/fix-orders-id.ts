// Script to convert 'orderId' string fields to '_id' ObjectId fields in the 'orders' collection
// Usage: Run with `npx ts-node scripts/fix-orders-id.ts` (after installing ts-node if needed)

import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'sports_ecommerce';

if (!uri) {
  throw new Error('MONGODB_URI is not set in environment variables');
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const orders = db.collection('orders');

  // Find all orders with 'orderId' but missing '_id' or with _id as a string
  const cursor = orders.find({ orderId: { $exists: true } });
  let updated = 0;
  for await (const doc of cursor) {
    if (typeof doc._id === 'string' && /^[a-f\d]{24}$/i.test(doc._id)) {
      // Convert string _id to ObjectId
      const newId = new ObjectId(doc._id);
      await orders.deleteOne({ _id: doc._id });
      await orders.insertOne({ ...doc, _id: newId });
      updated++;
    } else if (!doc._id && typeof doc.orderId === 'string' && /^[a-f\d]{24}$/i.test(doc.orderId)) {
      // Set _id from orderId
      const newId = new ObjectId(doc.orderId);
      await orders.updateOne({ orderId: doc.orderId }, { $set: { _id: newId } });
      updated++;
    }
  }
  console.log(`Updated ${updated} orders.`);
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
