/**
 * Brand migration script
 *
 * Reads brand records from scripts/brands-data.json and upserts them into the
 * MongoDB `brands` collection in the sports_ecommerce database.
 *
 * Usage:
 *   MONGODB_URI=<uri> npm run migrate:brands
 *   MONGODB_URI=<uri> tsx scripts/migrate-brands.ts
 *
 * Each entry in brands-data.json may include:
 *   - name          (string, required) — used as the upsert key
 *   - logoUrl       (string)           — legacy URL field kept for compatibility
 *   - logoKey       (string)           — S3 / storage key for the logo
 *   - associatedSports (string[])      — array of 24-char hex ObjectId strings
 *   - isPublished   (boolean)
 *   - createdAt     (ISO string)
 *   - updatedAt     (ISO string)
 */

import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrandRecord {
  name: string;
  logoUrl?: string;
  logoKey?: string;
  /** Raw values from JSON — may be 24-char hex strings or already-valid ObjectIds */
  associatedSports?: string[];
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_ecommerce';

const DB_NAME = process.env.MONGODB_DB_NAME || 'sports_ecommerce';

const DATA_FILE = resolve(__dirname, 'brands-data.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a string to ObjectId when it looks like a valid 24-char hex id. */
function toObjectId(value: string): ObjectId | null {
  if (/^[a-f\d]{24}$/i.test(value)) {
    return new ObjectId(value);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function migrateBrands(): Promise<void> {
  // 1. Load JSON data
  let brands: BrandRecord[];
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    brands = JSON.parse(raw) as BrandRecord[];
    console.log(`📂  Loaded ${brands.length} brand(s) from ${DATA_FILE}`);
  } catch (err) {
    console.error(`❌  Failed to read data file at ${DATA_FILE}:`, err);
    process.exit(1);
  }

  // 2. Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('🔗  Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('brands');

    // 3. Upsert each brand
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const brand of brands) {
      if (!brand.name || typeof brand.name !== 'string') {
        console.warn('⚠️   Skipping entry with missing or invalid name:', brand);
        failed++;
        continue;
      }

      // Convert associatedSports string IDs → ObjectIds (skip invalid values)
      const associatedSports: ObjectId[] = (brand.associatedSports ?? [])
        .map((id) => toObjectId(id))
        .filter((id): id is ObjectId => id !== null);

      if (
        brand.associatedSports &&
        associatedSports.length !== brand.associatedSports.length
      ) {
        const skipped =
          brand.associatedSports.length - associatedSports.length;
        console.warn(
          `⚠️   "${brand.name}": skipped ${skipped} invalid associatedSports value(s)`
        );
      }

      const now = new Date();

      const $set: Record<string, unknown> = {
        logoUrl: brand.logoUrl ?? '',
        logoKey: brand.logoKey ?? '',
        associatedSports,
        isPublished: brand.isPublished ?? false,
        updatedAt: brand.updatedAt ? new Date(brand.updatedAt) : now,
      };

      const $setOnInsert: Record<string, unknown> = {
        createdAt: brand.createdAt ? new Date(brand.createdAt) : now,
      };

      try {
        const result = await collection.updateOne(
          { name: brand.name },
          { $set, $setOnInsert },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          console.log(`  ✅  Inserted: "${brand.name}"`);
          inserted++;
        } else if (result.modifiedCount > 0) {
          console.log(`  🔄  Updated:  "${brand.name}"`);
          updated++;
        } else {
          console.log(`  ➖  No change: "${brand.name}" (already up-to-date)`);
        }
      } catch (err) {
        console.error(`  ❌  Error upserting "${brand.name}":`, err);
        failed++;
      }
    }

    // 4. Summary
    console.log('\n📊  Migration complete:');
    console.log(`    Inserted : ${inserted}`);
    console.log(`    Updated  : ${updated}`);
    console.log(`    Failed   : ${failed}`);
    console.log(`    Total    : ${brands.length}`);
  } finally {
    await client.close();
    console.log('🔌  Disconnected from MongoDB');
  }
}

migrateBrands().catch((err) => {
  console.error('❌  Unhandled error during migration:', err);
  process.exit(1);
});
