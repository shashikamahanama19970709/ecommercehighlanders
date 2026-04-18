import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isValidObjectId } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import LandingHeroBannerModule from '@/lib/models/LandingHeroBannerModule';
import Sport from '@/lib/models/Sport';

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
  if (!s3Client || !b2Bucket || !key) return undefined;
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: b2Bucket,
      Key: key,
    }),
    { expiresIn: 3600 }
  );
}

async function resolveSportId(value: unknown): Promise<string | null> {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isValidObjectId(trimmed)) return trimmed;

  const sport = await Sport.findOne({ name: trimmed }).select('_id').lean();
  return sport?._id?.toString?.() ?? null;
}

// GET /api/landing/hero-banner
export async function GET() {
  try {
    await connectToDatabase();

    const doc = await LandingHeroBannerModule.findOne({ moduleName: 'landing-hero-banner' })
      .populate('entries.sport', 'name')
      .lean();

    if (!doc) {
      return NextResponse.json({ moduleName: 'landing-hero-banner', entries: [], isActive: true });
    }

    const entries = await Promise.all(
      (doc.entries || []).map(async (entry: any) => {
        const videoKey = entry.videoKey as string | undefined;
        const videoUrl = await signKey(videoKey);
        return {
          ...entry,
          videoUrl,
        };
      })
    );

    return NextResponse.json({ ...doc, entries });
  } catch (error) {
    console.error('Error fetching landing hero banner module:', error);
    return NextResponse.json({ message: 'Error fetching landing hero banner module' }, { status: 500 });
  }
}

// PUT /api/landing/hero-banner
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const rawEntries = Array.isArray(body?.entries) ? body.entries : [];

    if (rawEntries.length === 0) {
      return NextResponse.json({ message: 'Select at least 1 sport' }, { status: 400 });
    }
    if (rawEntries.length > 3) {
      return NextResponse.json({ message: 'You can select at most 3 sports' }, { status: 400 });
    }

    const normalizedEntries = [] as { sport: string; videoKey: string }[];
    const seenSports = new Set<string>();

    for (const entry of rawEntries) {
      const sportId = await resolveSportId(entry?.sport);
      if (!sportId) {
        return NextResponse.json({ message: 'Invalid sport selected' }, { status: 400 });
      }
      if (seenSports.has(sportId)) {
        return NextResponse.json({ message: 'Duplicate sport selected' }, { status: 400 });
      }
      seenSports.add(sportId);

      const videoKey = typeof entry?.videoKey === 'string' ? entry.videoKey.trim() : '';
      if (!videoKey) {
        return NextResponse.json({ message: 'Upload a video for each selected sport' }, { status: 400 });
      }

      normalizedEntries.push({ sport: sportId, videoKey });
    }

    const updated = await LandingHeroBannerModule.findOneAndUpdate(
      { moduleName: 'landing-hero-banner' },
      {
        $set: {
          moduleName: 'landing-hero-banner',
          entries: normalizedEntries,
          isActive: body?.isActive ?? true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('entries.sport', 'name')
      .lean();

    const entries = await Promise.all(
      (updated?.entries || []).map(async (entry: any) => {
        const videoUrl = await signKey(entry?.videoKey);
        return { ...entry, videoUrl };
      })
    );

    return NextResponse.json({ ...updated, entries });
  } catch (error) {
    console.error('Error saving landing hero banner module:', error);
    return NextResponse.json({ message: 'Error saving landing hero banner module' }, { status: 500 });
  }
}
