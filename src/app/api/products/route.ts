import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Product from '@/lib/models/Product';
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

// GET /api/products - list products (optionally filter by sport or equipment)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const equipment = searchParams.get('equipment');

    await connectToDatabase();

    const query: Record<string, unknown> = { isActive: true };
    if (sport) query.sport = sport;
    if (equipment) query.equipment = equipment;

    const products = await Product.find(query)
      .populate('sport', 'name')
      .populate('equipment', 'name')
      .populate('brand', 'name')
      .sort({ createdAt: -1 });

    // Generate signed URLs for images
    if (s3Client) {
      const productsWithSignedUrls = await Promise.all(
        products.map(async (product) => {
          const productObj = product.toObject();
          let featureImageUrl;
          let imageUrls = [];

          if (product.featureImageKey) {
            featureImageUrl = await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: b2Bucket,
                Key: product.featureImageKey,
              }),
              { expiresIn: 3600 } // 1 hour
            );
          }

          if (product.imageKeys && product.imageKeys.length > 0) {
            imageUrls = await Promise.all(
              product.imageKeys.map(key =>
                getSignedUrl(
                  s3Client,
                  new GetObjectCommand({
                    Bucket: b2Bucket,
                    Key: key,
                  }),
                  { expiresIn: 3600 }
                )
              )
            );
          }

          return {
            ...productObj,
            featureImageUrl,
            imageUrls,
          };
        })
      );
      return NextResponse.json(productsWithSignedUrls);
    } else {
      return NextResponse.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}

// POST /api/products - create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const product = new Product({
      sport: body.sport,
      equipment: body.equipment,
      brand: body.brand,
      price: Number(body.price),
      specifications: body.specifications || {},
      featureImageKey: body.featureImageKey,
      imageKeys: body.imageKeys || [],
      stock: Number(body.stock) || 0,
      isActive: body.isActive ?? true,
    });

    const savedProduct = await product.save();

    // Generate signed URLs for the saved product
    let featureImageUrl;
    let imageUrls = [];

    if (s3Client) {
      if (savedProduct.featureImageKey) {
        featureImageUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: b2Bucket,
            Key: savedProduct.featureImageKey,
          }),
          { expiresIn: 3600 }
        );
      }

      if (savedProduct.imageKeys && savedProduct.imageKeys.length > 0) {
        imageUrls = await Promise.all(
          savedProduct.imageKeys.map(key =>
            getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: b2Bucket,
                Key: key,
              }),
              { expiresIn: 3600 }
            )
          )
        );
      }
    }

    return NextResponse.json({
      ...savedProduct.toObject(),
      featureImageUrl,
      imageUrls,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Error creating product' }, { status: 500 });
  }
}
