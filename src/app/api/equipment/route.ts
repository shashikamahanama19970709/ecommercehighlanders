import { NextRequest, NextResponse } from 'next/server';
import Equipment from '@/lib/models/Equipment';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/equipment - list equipment (optionally filter by sport)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sportId = searchParams.get('sportId');
    const status = searchParams.get('status');

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (sportId) query.sport = sportId;
    if (status) query.status = status;

    const equipment = await Equipment.find(query)
      .populate('sport', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ message: 'Error fetching equipment' }, { status: 500 });
  }
}

// POST /api/equipment - create equipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const equipment = new Equipment({
      name: body.name,
      sport: body.sportId,
      category: body.category,
      description: body.description,
      totalStock: Number(body.totalStock) || 0,
      availableStock: Number(body.availableStock) || 0,
      status: body.status || 'active',
      specifications: body.specifications || {},
    });

    const savedEquipment = await equipment.save();
    await savedEquipment.populate('sport', 'name');

    return NextResponse.json(savedEquipment, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ message: 'Error creating equipment' }, { status: 500 });
  }
}