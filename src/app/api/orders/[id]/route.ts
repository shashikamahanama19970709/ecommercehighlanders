import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/mongodb';
import type { Order } from '@/types/order';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return NextResponse.json({ message: 'Order ID required' }, { status: 400 });
  try {
    const ordersCol = await getCollection<Order>('orders');
    const order = await ordersCol.findOne({ _id: new ObjectId(id) } as any);
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ message: 'Error fetching order' }, { status: 500 });
  }
}
