import { NextRequest, NextResponse } from 'next/server';
import Equipment from '@/lib/models/Equipment';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/equipment/[id] - get single equipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const equipment = await Equipment.findById(id).populate('sport', 'name');

    if (!equipment) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ message: 'Error fetching equipment' }, { status: 500 });
  }
}

// PUT /api/equipment/[id] - update equipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const { id } = await params;

    const updateData = {
      name: body.name,
      sport: body.sportId,
      category: body.category,
      description: body.description,
      totalStock: Number(body.totalStock),
      availableStock: Number(body.availableStock),
      status: body.status,
      specifications: body.specifications,
    };

    const equipment = await Equipment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sport', 'name');

    if (!equipment) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ message: 'Error updating equipment' }, { status: 500 });
  }
}

// DELETE /api/equipment/[id] - delete equipment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const equipment = await Equipment.findByIdAndDelete(id);

    if (!equipment) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ message: 'Error deleting equipment' }, { status: 500 });
  }
}