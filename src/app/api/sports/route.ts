import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { connectToDatabase } from '@/lib/mongodb';
import '@/lib/models'; // Import all models to ensure registration
import Sport from '@/lib/models/Sport';

// Prevent Next.js from attempting to statically render this route during build.
export const dynamic = 'force-dynamic';

const b2Endpoint = process.env.B2_ENDPOINT;
const b2Bucket = process.env.B2_BUCKET_NAME;
const b2Region = process.env.B2_REGION || "us-west-002";
const b2KeyId = process.env.B2_KEY_ID;
const b2AppKey = process.env.B2_S3_APPLICATION_KEY;

const s3Client =
  b2Endpoint && b2Bucket && b2KeyId && b2AppKey &&
  !b2Endpoint.includes('YOUR-REGION') && !b2Bucket.includes('your-bucket')
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

export async function GET() {
  try {
    await connectToDatabase();

    const sports = await Sport.find().sort({ name: 1 }).maxTimeMS(8000);

    // Resolve proxy URLs for images
    const sportsWithUrls = sports.map((sport) => {
      return {
        ...sport.toObject(),
        imageUrl: sport.imageKey ? `/api/upload?key=${encodeURIComponent(sport.imageKey)}` : undefined,
      };
    });
    return NextResponse.json(sportsWithUrls);
  } catch (error) {
    console.error('Error fetching sports:', error);
    return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, equipmentTypes, imageKey } = body;

    // Check if sport already exists
    const existingSport = await Sport.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingSport) {
      return NextResponse.json({ error: 'Sport already exists' }, { status: 400 });
    }

    const sport = new Sport({
      name,
      equipmentTypes,
      ...(imageKey && imageKey.trim() && { imageKey }),
    });

    await sport.save();

    return NextResponse.json({
      ...sport.toObject(),
      imageUrl: sport.imageKey ? `/api/upload?key=${encodeURIComponent(sport.imageKey)}` : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sport:', error);
    return NextResponse.json({ error: 'Failed to create sport' }, { status: 500 });
  }
}