import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const { email, sessionId } = await request.json();
  if (!email || !sessionId) {
    return NextResponse.json({ message: 'Email and session ID are required.' }, { status: 400 });
  }
  const col = await getCollection('checkout_sessions');
  let session = null;
  // Try by Stripe session ID
  session = await col.findOne({ stripeSessionId: sessionId, email });
  // If not found, try by MongoDB _id
  if (!session) {
    try {
      session = await col.findOne({ _id: new ObjectId(sessionId), email });
    } catch {
      // ignore invalid ObjectId
    }
  }
  if (!session) {
    return NextResponse.json({ message: 'Order not found. Please check your email and session ID.' }, { status: 404 });
  }
  return NextResponse.json({ session });
}
