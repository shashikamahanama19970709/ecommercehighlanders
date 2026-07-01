import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { connectToDatabase } from '@/lib/mongodb';
import Sport from '@/lib/models/Sport';

const b2Endpoint = process.env.B2_ENDPOINT;
const b2Bucket = process.env.B2_BUCKET_NAME;
const b2Region = process.env.B2_REGION || "us-west-002";
const b2KeyId = process.env.B2_KEY_ID;
const b2AppKey = process.env.B2_APPLICATION_KEY;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const sport = await Sport.findById(id);

    if (!sport) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 });
    }

    // Generate signed URL for image
    let imageUrl;
    if (s3Client && sport.imageKey) {
      imageUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: b2Bucket,
          Key: sport.imageKey,
        }),
        { expiresIn: 3600 } // 1 hour
      );
    }

    return NextResponse.json({
      ...sport.toObject(),
      imageUrl,
    });
  } catch (error) {
    console.error('Error fetching sport:', error);
    return NextResponse.json({ error: 'Failed to fetch sport' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { name, equipmentTypes, imageKey } = body;

    // Check if another sport with the same name exists
    const existingSport = await Sport.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingSport) {
      return NextResponse.json({ error: 'Sport name already exists' }, { status: 400 });
    }

    const updateData: any = { name, equipmentTypes };
    if (imageKey && imageKey.trim()) {
      updateData.imageKey = imageKey;
    }

    const sport = await Sport.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!sport) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...sport.toObject(),
      imageUrl: sport.imageKey ? `/api/upload?key=${encodeURIComponent(sport.imageKey)}` : undefined,
    });
  } catch (error) {
    console.error('Error updating sport:', error);
    return NextResponse.json({ error: 'Failed to update sport' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const sport = await Sport.findByIdAndDelete(id);

    if (!sport) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sport deleted successfully' });
  } catch (error) {
    console.error('Error deleting sport:', error);
    return NextResponse.json({ error: 'Failed to delete sport' }, { status: 500 });
  }
}