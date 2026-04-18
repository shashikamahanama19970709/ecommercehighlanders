import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

type PaymentSettingsDoc = {
  _id?: unknown;
  key: 'payment';
  sandboxEnabled: boolean;
  updatedAt: string;
};

const SETTINGS_KEY = 'payment' as const;

export async function GET() {
  const settingsCol = await getCollection<PaymentSettingsDoc>('settings');
  const existing = await settingsCol.findOne({ key: SETTINGS_KEY } as any);

  return NextResponse.json({
    sandboxEnabled: existing?.sandboxEnabled ?? true,
    updatedAt: existing?.updatedAt ?? null,
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { sandboxEnabled?: unknown } | null;
    const sandboxEnabled = Boolean(body?.sandboxEnabled);

    const settingsCol = await getCollection<PaymentSettingsDoc>('settings');
    const updatedAt = new Date().toISOString();

    await settingsCol.updateOne(
      { key: SETTINGS_KEY } as any,
      { $set: { key: SETTINGS_KEY, sandboxEnabled, updatedAt } },
      { upsert: true }
    );

    return NextResponse.json({ sandboxEnabled, updatedAt });
  } catch (error) {
    console.error('Error updating payment settings', error);
    return NextResponse.json({ message: 'Error updating payment settings' }, { status: 500 });
  }
}
