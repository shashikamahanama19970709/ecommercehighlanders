import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isValidObjectId } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';



const b2Endpoint = process.env.B2_ENDPOINT;
const b2Bucket = process.env.B2_BUCKET_NAME;
const b2Region = process.env.B2_REGION || 'us-west-002';
const b2KeyId = process.env.B2_KEY_ID;
const b2AppKey = process.env.B2_APPLICATION_KEY;

const s3Client =
  b2Endpoint &&
  b2Bucket &&
  b2KeyId &&
  b2AppKey &&
  !b2Endpoint.includes('YOUR-REGION') &&
  !b2Bucket.includes('your-bucket')
    ? new S3Client({
        region: b2Region,
        endpoint: b2Endpoint,
        credentials: {
          accessKeyId: b2KeyId,
          secretAccessKey: b2AppKey,
        },
        forcePathStyle: true,
      })
    : null;

async function signKey(key?: string): Promise<string | undefined> {
  if (!key) return undefined;
  return `/api/upload?key=${encodeURIComponent(key)}`;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map((v) => v.trim());
}


// GET /api/shop-by-sport
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive =
      searchParams.get('includeInactive') === '1' || searchParams.get('includeInactive') === 'true';

    await connectToDatabase();
    const ShopBySportModule = (await import('@/lib/models/ShopBySportModule')).default;
    const Sport = (await import('@/lib/models/Sport')).default;
    const Equipment = (await import('@/lib/models/Equipment')).default;
    const Product = (await import('@/lib/models/Product')).default;

    const doc = await ShopBySportModule.findOne(includeInactive ? {} : { isActive: true })
      .populate('entries.sport', 'name')
      .populate({
        path: 'entries.productIds',
        // Include legacy `model` in case older docs stored a single model string.
        select:
          'sport equipment brand price stock featureImageKey imageKeys images isActive models model name specifications',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'equipment', select: 'name' },
          { path: 'sport', select: 'name' },
        ],
      })
      .lean();

    if (!doc) {
      return NextResponse.json({ entries: [], isActive: true });
    }

    const entries = await Promise.all(
      (doc.entries || []).map(async (entry: any) => {
        const heroImageKey = entry.heroImageKey as string | undefined;
        const heroImageUrl = await signKey(heroImageKey);

        const productsRaw = Array.isArray(entry.productIds) ? entry.productIds : [];

        const products = await Promise.all(
          productsRaw.map(async (p: any) => {
            const productObj = typeof p?.toObject === 'function' ? p.toObject() : p;

            const modelsValue: unknown = productObj?.models;
            const normalizedModels =
              Array.isArray(modelsValue)
                ? modelsValue
                    .filter((m): m is string => typeof m === 'string' && m.trim() !== '')
                    .map((m) => m.trim())
                : typeof modelsValue === 'string' && modelsValue.trim() !== ''
                  ? [modelsValue.trim()]
                  : typeof productObj?.model === 'string' && productObj.model.trim() !== ''
                    ? [productObj.model.trim()]
                    : undefined;

            const featureImageKey = productObj?.featureImageKey as string | undefined;
            const featureImageUrl = await signKey(featureImageKey);

            const imageKeys = Array.isArray(productObj?.imageKeys) ? (productObj.imageKeys as string[]) : [];
            const imageUrls =
              imageKeys.length > 0 ? await Promise.all(imageKeys.map((key) => signKey(key))) : undefined;

            return {
              ...productObj,
              ...(normalizedModels ? { models: normalizedModels } : {}),
              featureImageUrl,
              imageUrls: imageUrls?.filter(Boolean),
            };
          })
        );

        return {
          ...entry,
          heroImageUrl,
          products,
        };
      })
    );

    return NextResponse.json({ ...doc, entries });
  } catch (error) {
    console.error('Error fetching shop-by-sport module:', error);
    return NextResponse.json({ message: 'Error fetching shop-by-sport module' }, { status: 500 });
  }
}

// PUT /api/shop-by-sport - upsert module
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const ShopBySportModule = (await import('@/lib/models/ShopBySportModule')).default;
    const Sport = (await import('@/lib/models/Sport')).default;
    const Equipment = (await import('@/lib/models/Equipment')).default;
    const Product = (await import('@/lib/models/Product')).default;

    const rawEntries = Array.isArray(body?.entries) ? body.entries : [];
    if (rawEntries.length === 0) {
      return NextResponse.json({ message: 'At least 1 sport entry is required' }, { status: 400 });
    }
    if (rawEntries.length > 5) {
      return NextResponse.json({ message: 'You can select at most 5 sports' }, { status: 400 });
    }

    const normalizedEntries = [] as { sport: string; heroImageKey: string; productIds: string[] }[];
    const seenSports = new Set<string>();

    for (const entry of rawEntries) {
      const sportId = await (async (value: unknown) => {
        if (typeof value !== 'string' || value.trim() === '') return null;
        if (isValidObjectId(value)) return value;
        const sport = await Sport.findOne({ name: value.trim() }).select('_id').lean();
        return sport?._id?.toString?.() ?? null;
      })(entry?.sport);
      if (!sportId) {
        return NextResponse.json({ message: 'Invalid sport in entries' }, { status: 400 });
      }
      if (seenSports.has(sportId)) {
        return NextResponse.json({ message: 'Duplicate sport selected' }, { status: 400 });
      }
      seenSports.add(sportId);

      const heroImageKey =
        typeof entry?.heroImageKey === 'string' && entry.heroImageKey.trim() ? entry.heroImageKey.trim() : '';
      if (!heroImageKey) {
        return NextResponse.json({ message: 'Upload a hero image for each selected sport' }, { status: 400 });
      }

      const productIds = normalizeStringArray(entry?.productIds);
      if (productIds.length < 1 || productIds.length > 4) {
        return NextResponse.json({ message: 'Each sport must have 1 to 4 products' }, { status: 400 });
      }
      for (const pid of productIds) {
        if (!isValidObjectId(pid)) {
          return NextResponse.json({ message: 'Invalid product selected' }, { status: 400 });
        }
      }

      const products = await Product.find({ _id: { $in: productIds } }).select('sport').lean();
      if (products.length !== productIds.length) {
        return NextResponse.json({ message: 'One or more selected products were not found' }, { status: 400 });
      }
      const sportMismatch = products.some((p: any) => p?.sport?.toString?.() !== sportId);
      if (sportMismatch) {
        return NextResponse.json({ message: 'Selected products must belong to the chosen sport' }, { status: 400 });
      }

      normalizedEntries.push({
        sport: sportId,
        heroImageKey,
        productIds,
      });
    }

    const updated = await ShopBySportModule.findOneAndUpdate(
      {},
      {
        $set: {
          entries: normalizedEntries,
          isActive: body?.isActive ?? true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error saving shop-by-sport module:', error);
    return NextResponse.json({ message: 'Error saving shop-by-sport module' }, { status: 500 });
  }
}
