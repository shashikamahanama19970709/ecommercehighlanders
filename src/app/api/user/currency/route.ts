import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const currency = typeof body?.currency === 'string' ? body.currency.trim().toUpperCase() : null;

    if (!currency) {
      return NextResponse.json({ message: 'Currency is required' }, { status: 400 });
    }

    const usersCol = await getCollection<any>('users');
    await usersCol.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { baseCurrency: currency, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true, baseCurrency: currency });
  } catch (error) {
    console.error('Error saving user base currency preference:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
