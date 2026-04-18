import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(_request: NextRequest, { params }: { params: { sessionId: string } }) {
  const col = await getCollection('checkout_sessions');
  const session = await col.findOne({ stripeSessionId: params.sessionId });
  if (!session) return NextResponse.json({ session: null }, { status: 404 });
  return NextResponse.json({ session });
}
