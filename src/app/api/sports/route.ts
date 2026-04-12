import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Sport from '@/lib/models/Sport';

export async function GET() {
  try {
    await connectToDatabase();

    const sports = await Sport.find().sort({ name: 1 });

    return NextResponse.json(sports);
  } catch (error) {
    console.error('Error fetching sports:', error);
    return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, equipmentTypes } = body;

    // Check if sport already exists
    const existingSport = await Sport.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingSport) {
      return NextResponse.json({ error: 'Sport already exists' }, { status: 400 });
    }

    const sport = new Sport({
      name,
      equipmentTypes,
    });

    await sport.save();

    return NextResponse.json(sport, { status: 201 });
  } catch (error) {
    console.error('Error creating sport:', error);
    return NextResponse.json({ error: 'Failed to create sport' }, { status: 500 });
  }
}