import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')?.trim() || '';
  const col = await getCollection('checkout_sessions');
  const query: any = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { stripeSessionId: { $regex: search, $options: 'i' } },
    ];
  }
  const sessions = await col
    .find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return NextResponse.json({ sessions });
}
