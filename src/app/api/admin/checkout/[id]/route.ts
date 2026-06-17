import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const col = await getCollection('checkout_sessions');
  let session = null;
  let debug = { tried: [] as any[], foundBy: null as string | null };
  // Try by _id as ObjectId
  try {
    session = await col.findOne({ _id: new ObjectId(id) } as any);
    debug.tried.push({ method: '_id:ObjectId', value: id });
    if (session) debug.foundBy = '_id:ObjectId';
  } catch (e: any) {
    debug.tried.push({ method: '_id:ObjectId', value: id, error: e?.message });
  }
  // Try by _id as string
  if (!session) {
    session = await col.findOne({ _id: id } as any);
    debug.tried.push({ method: '_id:string', value: id });
    if (session) debug.foundBy = '_id:string';
  }
  // Try by stripeSessionId
  if (!session) {
    session = await col.findOne({ stripeSessionId: id } as any);
    debug.tried.push({ method: 'stripeSessionId', value: id });
    if (session) debug.foundBy = 'stripeSessionId';
  }
  if (!session) return NextResponse.json({ session: null, debug }, { status: 404 });
  return NextResponse.json({ session, debug });
}

// PATCH for mark as paid/failed (admin action)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await request.json();
  if (!['paid', 'failed'].includes(status)) {
    return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
  }
  const col = await getCollection('checkout_sessions');
  let result;
  try {
    result = await col.updateOne(
      { _id: new ObjectId(id) } as any,
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
  } catch {
    result = await col.updateOne(
      { _id: id } as any,
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
  }
  if (result.matchedCount === 0) return NextResponse.json({ message: 'Session not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

