import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ unwrap params correctly
    const { id } = await context.params;

    const col = await getCollection('orders');

    console.log('[API] Dispatch order ID:', id);

    // ✅ validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'dispatched',
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // 🔍 Debug info (helps a lot)
    console.log('[API] update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Order already dispatched' },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (e: unknown) {
    console.error('[API] Dispatch error:', e);

    return NextResponse.json(
      { success: false, error: (e as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}