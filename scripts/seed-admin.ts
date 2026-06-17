import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sports_ecommerce";
const DB_NAME = process.env.MONGODB_DB_NAME || "sports_ecommerce";

async function seedAdmin() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCol = db.collection("users");

    const email = "admin@example.com";
    const password = "123456";
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await usersCol.findOne({ email });
    if (existing) {
      // Update existing user to ensure correct password, role, and emailVerified
      await usersCol.updateOne(
        { email },
        {
          $set: {
            passwordHash,
            role: "admin",
            emailVerified: true,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      console.log(`✅ Updated existing user "${email}" with admin role, verified email, and password "123456".`);
    } else {
      await usersCol.insertOne({
        name: "Admin",
        email,
        passwordHash,
        role: "admin",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Created admin user "${email}" with password "123456".`);
    }
  } finally {
    await client.close();
  }
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
