import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SpecificationFieldTemplate from '@/lib/models/SpecificationFieldTemplate';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') ?? '').trim();

    await connectToDatabase();

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { label: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const templates = await SpecificationFieldTemplate.find(filter).sort({ label: 1, name: 1 }).limit(200);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching specification fields:', error);
    return NextResponse.json({ message: 'Error fetching specification fields' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const label = typeof body?.label === 'string' ? body.label.trim() : '';
    const type = typeof body?.type === 'string' ? body.type : 'text';
    const options = Array.isArray(body?.options)
      ? body.options.filter((o: any) => typeof o === 'string' && o.trim()).map((o: string) => o.trim())
      : [];

    if (!name || !label) {
      return NextResponse.json({ message: 'name and label are required' }, { status: 400 });
    }

    await connectToDatabase();

    const saved = await SpecificationFieldTemplate.findOneAndUpdate(
      { name },
      { $set: { name, label, type, options } },
      { upsert: true, new: true }
    );

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving specification field:', error);
    return NextResponse.json({ message: 'Error saving specification field' }, { status: 500 });
  }
}
