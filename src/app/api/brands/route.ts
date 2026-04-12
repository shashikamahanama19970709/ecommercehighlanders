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

// GET /api/brands - list all brands with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sportId = searchParams.get('sportId');
    const equipmentId = searchParams.get('equipmentId');

    await connectToDatabase();

    let query: any = {};

    if (sportId) {
      query.associatedSports = sportId;
    }

    const brands = await Brand.find(query)
      .populate('associatedSports', 'name _id')
      .sort({ name: 1 });

    // Generate signed URLs for logos
    if (s3Client) {
      const brandsWithSignedUrls = await Promise.all(
        brands.map(async (brand) => {
          let logoUrl;
          if (brand.logoKey) {
            logoUrl = await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: b2Bucket,
                Key: brand.logoKey,
              }),
              { expiresIn: 3600 } // 1 hour
            );
          } else {
            // For old brands with logoUrl as direct URL
            logoUrl = brand.logoUrl;
          }
          return {
            ...brand.toObject(),
            logoUrl,
          };
        })
      );
      return NextResponse.json(brandsWithSignedUrls);
    } else {
      // If no s3Client, return brands with existing logoUrl
      return NextResponse.json(brands);
    }
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ message: 'Error fetching brands' }, { status: 500 });
  }
}

// POST /api/brands - create brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const brand = new Brand({
      name: body.name,
      logoKey: body.logoKey,
      associatedSports: body.associatedSports,
      isPublished: body.isPublished ?? false,
    });

    const savedBrand = await brand.save();
    await savedBrand.populate('associatedSports', 'name _id');

    // Generate signed URL for the new brand
    let logoUrl;
    if (s3Client && savedBrand.logoKey) {
      logoUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: b2Bucket,
          Key: savedBrand.logoKey,
        }),
        { expiresIn: 3600 }
      );
    }

    return NextResponse.json({
      ...savedBrand.toObject(),
      logoUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ message: 'Error creating brand' }, { status: 500 });
  }
}