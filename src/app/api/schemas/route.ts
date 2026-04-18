import { NextRequest, NextResponse } from 'next/server';
import CategorySchema from '@/lib/models/CategorySchema';
import SpecificationFieldTemplate from '@/lib/models/SpecificationFieldTemplate';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const equipmentType = typeof body?.equipmentType === 'string' ? body.equipmentType.trim() : '';
    const fields = Array.isArray(body?.fields) ? body.fields : [];

    if (!equipmentType) {
      return NextResponse.json({ message: 'equipmentType is required' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedFields = fields
      .map((f: any) => ({
        name: typeof f?.name === 'string' ? f.name.trim() : '',
        label: typeof f?.label === 'string' ? f.label.trim() : '',
        type: typeof f?.type === 'string' ? f.type : 'text',
        options: Array.isArray(f?.options)
          ? f.options
              .filter((o: any) => typeof o === 'string' && o.trim())
              .map((o: string) => o.trim())
          : undefined,
        required: Boolean(f?.required),
      }))
      .filter((f: any) => f.name && f.label);

    const schema = await CategorySchema.findOneAndUpdate(
      { equipmentType },
      { $set: { equipmentType, fields: normalizedFields } },
      { new: true, upsert: true }
    );

    for (const field of normalizedFields) {
      await SpecificationFieldTemplate.findOneAndUpdate(
        { name: field.name },
        {
          $set: {
            name: field.name,
            label: field.label,
            type: field.type,
            options: field.options ?? [],
          },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error saving schema:', error);
    return NextResponse.json({ message: 'Error saving schema' }, { status: 500 });
  }
}