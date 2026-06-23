import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isValidObjectId } from 'mongoose';
import Product from '@/lib/models/Product';
import Sport from '@/lib/models/Sport';
import Equipment from '@/lib/models/Equipment';
import Brand from '@/lib/models/Brand';
import { connectToDatabase, getCollection } from '@/lib/mongodb';

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

async function resolveIdOrName(
  value: unknown,
  opts: {
    kind: 'sport' | 'brand';
  }
): Promise<string | null> {
  if (typeof value !== 'string' || value.trim() === '') return null;
  if (isValidObjectId(value)) return value;

  const name = value.trim();
  if (opts.kind === 'sport') {
    const sport = await Sport.findOne({ name }).select('_id').lean();
    return sport?._id?.toString?.() ?? null;
  }

  const brand = await Brand.findOne({ name }).select('_id').lean();
  return brand?._id?.toString?.() ?? null;
}

async function resolveEquipmentId(value: unknown, sportId: string | null): Promise<string | null> {
  if (typeof value !== 'string' || value.trim() === '') return null;
  if (isValidObjectId(value)) return value;
  if (!sportId) return null;

  const name = value.trim();

  const existing = await Equipment.findOne({ name, sport: sportId }).select('_id').lean();
  if (existing?._id) return existing._id.toString();

  try {
    const created = await Equipment.create({
      name,
      sport: sportId,
      category: name,
      status: 'active',
      totalStock: 0,
      availableStock: 0,
      specifications: {},
    });
    return created._id.toString();
  } catch {
    // In case of a race / duplicate key error, fetch once more.
    const again = await Equipment.findOne({ name, sport: sportId }).select('_id').lean();
    return again?._id?.toString?.() ?? null;
  }
}

// GET /api/products - list products (optionally filter by sport or equipment)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const equipment = searchParams.get('equipment');
    const includeInactive = searchParams.get('includeInactive') === '1' || searchParams.get('includeInactive') === 'true';

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (!includeInactive) query.isActive = true;

    if (sport) {
      const sportId = await resolveIdOrName(sport, { kind: 'sport' });
      if (sportId) query.sport = sportId;
    }

    if (equipment) {
      // Prefer filtering by id; if a name is passed, only resolve when sport is present.
      if (isValidObjectId(equipment)) {
        query.equipment = equipment;
      } else if (sport) {
        const sportId = await resolveIdOrName(sport, { kind: 'sport' });
        const equipmentId = await resolveEquipmentId(equipment, sportId);
        if (equipmentId) query.equipment = equipmentId;
      }
    }

    const sort = searchParams.get('sort');

    const products = await Product.find(query)
      .populate('sport', 'name')
      .populate('equipment', 'name')
      .populate('brand', 'name');

    if (sort === 'best-selling') {
      try {
        const ordersCol = await getCollection('orders');
        const salesData = await ordersCol.aggregate([
          { $match: { status: { $nin: ['failed', 'cancelled'] } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              totalSold: { $sum: '$items.quantity' }
            }
          }
        ]).toArray();

        const salesMap = new Map<string, number>(
          salesData.map((item) => [String(item._id), Number(item.totalSold)])
        );

        products.sort((a, b) => {
          const soldA = salesMap.get(a._id.toString()) || 0;
          const soldB = salesMap.get(b._id.toString()) || 0;
          if (soldB !== soldA) {
            return soldB - soldA;
          }
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
      } catch (err) {
        console.error('Error fetching best sellers from orders:', err);
        products.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
      }
    } else {
      products.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    }

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
              product.imageKeys.map((key: string) =>
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

    const sportId = await resolveIdOrName(body.sport, { kind: 'sport' });
    if (!sportId) {
      return NextResponse.json(
        { message: 'Invalid sport. Provide a sport id or existing sport name.' },
        { status: 400 }
      );
    }

    const brandId = await resolveIdOrName(body.brand, { kind: 'brand' });
    if (!brandId) {
      return NextResponse.json(
        { message: 'Invalid brand. Provide a brand id or existing brand name.' },
        { status: 400 }
      );
    }

    const equipmentId = await resolveEquipmentId(body.equipment, sportId);
    if (!equipmentId) {
      return NextResponse.json(
        {
          message:
            'Invalid equipment. Provide an equipment id or an existing equipment name that belongs to the selected sport.',
        },
        { status: 400 }
      );
    }

    const product = new Product({
      name: typeof body.name === 'string' ? body.name.trim() : undefined,
      description: typeof body.description === 'string' ? body.description.trim() : undefined,
      sku: typeof body.sku === 'string' ? body.sku.trim() : undefined,
      sport: sportId,
      equipment: equipmentId,
      brand: brandId,
      models:
        Array.isArray(body.models)
          ? body.models
          : typeof body.model === 'string' && body.model.trim()
            ? [body.model.trim()]
            : [],
      price: Number(body.price),
      discount: body.discount,
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
          savedProduct.imageKeys.map((key: string) =>
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
