import { NextRequest, NextResponse } from 'next/server';
import Brand from '@/lib/models/Brand';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/brands/[id] - get single brand
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const brand = await Brand.findById(id).populate('associatedSports', 'name');
    if (!brand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
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

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      {
        name: body.name,
        logoUrl: body.logoUrl,
        associatedSports: body.associatedSports,
        isPublished: body.isPublished,
      },
      { new: true }
    ).populate('associatedSports', 'name');

    if (!updatedBrand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(updatedBrand);
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