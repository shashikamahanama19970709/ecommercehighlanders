import { NextRequest, NextResponse } from 'next/server';
import Brand from '@/lib/models/Brand';
import { connectToDatabase } from '@/lib/mongodb';

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
      .populate('associatedSports', 'name')
      .sort({ name: 1 });

    return NextResponse.json(brands);
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
      logoUrl: body.logoUrl,
      associatedSports: body.associatedSports,
      isPublished: body.isPublished ?? false,
    });

    const savedBrand = await brand.save();
    await savedBrand.populate('associatedSports', 'name');

    return NextResponse.json(savedBrand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ message: 'Error creating brand' }, { status: 500 });
  }
}