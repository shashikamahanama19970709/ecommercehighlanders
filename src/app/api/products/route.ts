import { NextRequest, NextResponse } from 'next/server';
import Product from '@/lib/models/Product';
import { connectToDatabase } from '@/lib/mongodb';

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

    return NextResponse.json(products);
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
      images: body.images || [],
      stock: Number(body.stock) || 0,
      isActive: body.isActive ?? true,
    });

    const savedProduct = await product.save();

    return NextResponse.json(savedProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Error creating product' }, { status: 500 });
  }
}
