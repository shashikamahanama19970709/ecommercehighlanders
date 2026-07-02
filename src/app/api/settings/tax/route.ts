import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { auth } from '@/auth';

const SETTINGS_KEY = 'tax' as const;

export async function GET() {
  try {
    const settingsCol = await getCollection<any>('settings');
    const existing = await settingsCol.findOne({ key: SETTINGS_KEY });

    const defaultRates = [
      {
        id: 'uk-vat',
        label: 'UK VAT',
        rate: 20,
        country: 'United Kingdom',
        isActive: true,
      },
      {
        id: 'eu-vat',
        label: 'Europe VAT',
        rate: 21,
        country: 'Europe',
        isActive: true,
      },
      {
        id: 'intl-tax',
        label: 'International Tax',
        rate: 0,
        country: 'International',
        isActive: true,
      },
    ];

    return NextResponse.json({
      rates: existing?.rates ?? defaultRates,
      updatedAt: existing?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Error fetching tax settings', error);
    return NextResponse.json({ message: 'Error fetching tax settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const rates = Array.isArray(body?.rates) ? body.rates : [];

    if (rates.length === 0) {
      return NextResponse.json({ message: 'At least one tax rate is required' }, { status: 400 });
    }

    const settingsCol = await getCollection<any>('settings');
    const updatedAt = new Date().toISOString();

    await settingsCol.updateOne(
      { key: SETTINGS_KEY },
      {
        $set: {
          key: SETTINGS_KEY,
          rates,
          updatedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ rates, updatedAt });
  } catch (error) {
    console.error('Error updating tax settings', error);
    return NextResponse.json({ message: 'Error updating tax settings' }, { status: 500 });
  }
}
