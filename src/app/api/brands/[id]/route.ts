import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Brand from '@/lib/models/Brand';
import { connectToDatabase } from '@/lib/mongodb';

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

// GET /api/brands/[id] - get single brand
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const brand = await Brand.findById(id).populate('associatedSports', 'name _id');
    if (!brand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    // Generate signed URL
    let logoUrl;
    if (s3Client && brand.logoKey) {
      logoUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: b2Bucket,
          Key: brand.logoKey,
        }),
        { expiresIn: 3600 }
      );
    } else {
      logoUrl = brand.logoUrl;
    }

    return NextResponse.json({
      ...brand.toObject(),
      logoUrl,
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({ message: 'Error fetching brand' }, { status: 500 });
  }
}

// PUT /api/brands/[id] - update brand
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await connectToDatabase();

    const updateData: any = {
      name: body.name,
      associatedSports: body.associatedSports,
      isPublished: body.isPublished,
    };
    if (body.logoKey) {
      updateData.logoKey = body.logoKey;
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('associatedSports', 'name _id');

    if (!updatedBrand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    // Generate signed URL
    let logoUrl;
    if (s3Client && updatedBrand.logoKey) {
      logoUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: b2Bucket,
          Key: updatedBrand.logoKey,
        }),
        { expiresIn: 3600 }
      );
    } else {
      logoUrl = updatedBrand.logoUrl;
    }

    return NextResponse.json({
      ...updatedBrand.toObject(),
      logoUrl,
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ message: 'Error updating brand' }, { status: 500 });
  }
}

// DELETE /api/brands/[id] - delete brand
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const deletedBrand = await Brand.findByIdAndDelete(id);
    if (!deletedBrand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ message: 'Error deleting brand' }, { status: 500 });
  }
}