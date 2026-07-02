import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { auth } from '@/auth';
import type { ShippingOption } from '@/types/shipping-option';

const SETTINGS_KEY = 'shipping' as const;

export async function GET() {
  try {
    const settingsCol = await getCollection<any>('settings');
    const existing = await settingsCol.findOne({ key: SETTINGS_KEY });
    
    // Default options if none are saved in database yet
    const defaultOptions: ShippingOption[] = [
      {
        id: 'uk-standard',
        label: 'UK Standard Delivery',
        description: '2-4 business days',
        estimate: '2-4 business days',
        cost: 4.99,
        estimatedDays: 2,
        regions: ['UK'],
        isDefault: true,
      },
      {
        id: 'uk-express',
        label: 'UK Express Delivery',
        description: 'Next business day',
        estimate: 'Next business day',
        cost: 8.99,
        estimatedDays: 1,
        regions: ['UK'],
      },
      {
        id: 'europe',
        label: 'Europe Delivery',
        description: '3-7 business days',
        estimate: '3-7 business days',
        cost: 14.99,
        estimatedDays: 5,
        regions: ['Europe'],
      },
      {
        id: 'international',
        label: 'International Delivery',
        description: '5-14 business days',
        estimate: '5-14 business days',
        cost: 24.99,
        estimatedDays: 10,
        regions: ['International'],
      },
    ];

    return NextResponse.json({
      options: existing?.options ?? defaultOptions,
      updatedAt: existing?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Error fetching shipping settings', error);
    return NextResponse.json({ message: 'Error fetching shipping settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const options = Array.isArray(body?.options) ? body.options : [];

    // Simple validation
    if (options.length === 0) {
      return NextResponse.json({ message: 'At least one shipping option is required' }, { status: 400 });
    }

    const settingsCol = await getCollection<any>('settings');
    const updatedAt = new Date().toISOString();

    await settingsCol.updateOne(
      { key: SETTINGS_KEY },
      { $set: { key: SETTINGS_KEY, options, updatedAt } },
      { upsert: true }
    );

    return NextResponse.json({ options, updatedAt });
  } catch (error) {
    console.error('Error updating shipping settings', error);
    return NextResponse.json({ message: 'Error updating shipping settings' }, { status: 500 });
  }
}
