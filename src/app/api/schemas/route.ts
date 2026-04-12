import { NextRequest, NextResponse } from 'next/server';
import CategorySchema from '@/lib/models/CategorySchema';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ message: 'Equipment type is required' }, { status: 400 });
    }

    await connectToDatabase();
    const schema = await CategorySchema.findOne({ equipmentType: type });

    if (!schema) {
      return NextResponse.json({ message: 'Schema not found' }, { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json({ message: 'Error fetching schema' }, { status: 500 });
  }
}