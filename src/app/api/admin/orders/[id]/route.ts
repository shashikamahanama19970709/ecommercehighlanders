import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ unwrap params properly
    const { id } = await context.params;

    const col = await getCollection('orders');

    console.log('[API] Order ID:', id);

    // ✅ validate
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { order: null, message: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await col.findOne({
      _id: new ObjectId(id),
    });

    if (!order) {
      return NextResponse.json(
        { order: null, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });

  } catch (error) {
    console.error('[API] Error:', error);

    return NextResponse.json(
      { order: null, message: 'Server error' },
      { status: 500 }
    );
  }
}