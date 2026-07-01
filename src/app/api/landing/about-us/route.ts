import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { connectToDatabase } from '@/lib/mongodb';
import AboutUsModule from '@/lib/models/AboutUsModule';

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

// GET /api/landing/about-us
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const doc = await AboutUsModule.findOne({ moduleName: 'about-us' }).lean();

    if (!doc) {
      return NextResponse.json({ title: '', description: '' });
    }

    const signedImage1Url = await signKey(doc.image1Key);
    const signedImage2Url = await signKey(doc.image2Key);

    return NextResponse.json({
      ...doc,
      image1Url: signedImage1Url ?? doc.image1Url,
      image2Url: signedImage2Url ?? doc.image2Url,
    });
  } catch (error) {
    console.error('Error fetching about-us module:', error);
    return NextResponse.json({ message: 'Error fetching about-us module' }, { status: 500 });
  }
}

// PUT /api/landing/about-us - upsert module
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';

    const image1Key = typeof body?.image1Key === 'string' ? body.image1Key.trim() : '';
    const image1Url = typeof body?.image1Url === 'string' ? body.image1Url.trim() : '';
    const image2Key = typeof body?.image2Key === 'string' ? body.image2Key.trim() : '';
    const image2Url = typeof body?.image2Url === 'string' ? body.image2Url.trim() : '';

    const updated = await AboutUsModule.findOneAndUpdate(
      { moduleName: 'about-us' },
      {
        $set: {
          moduleName: 'about-us',
          title,
          description,
          image1Key: image1Key || undefined,
          image1Url: image1Url || undefined,
          image2Key: image2Key || undefined,
          image2Url: image2Url || undefined,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    const signedImage1Url = await signKey(updated?.image1Key);
    const signedImage2Url = await signKey(updated?.image2Key);

    return NextResponse.json({
      ...updated,
      image1Url: signedImage1Url ?? updated?.image1Url,
      image2Url: signedImage2Url ?? updated?.image2Url,
    });
  } catch (error) {
    console.error('Error saving about-us module:', error);
    return NextResponse.json({ message: 'Error saving about-us module' }, { status: 500 });
  }
}
