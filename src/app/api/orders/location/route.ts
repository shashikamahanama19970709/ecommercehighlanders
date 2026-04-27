import { NextRequest, NextResponse } from 'next/server';
import Order from '@/lib/models/Order';
import { getCollection } from '@/lib/mongodb';

// PATCH /api/orders/location?orderId=...
export async function PATCH(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ message: 'Missing orderId' }, { status: 400 });
  const { lat, lng } = await req.json();
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ message: 'Invalid coordinates' }, { status: 400 });
  }
  const updated = await Order.findByIdAndUpdate(
    orderId,
    { $set: { deliveryLocation: { lat, lng, updatedAt: new Date() } } },
    { new: true }
  );
  if (!updated) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  return NextResponse.json({ success: true, deliveryLocation: updated.deliveryLocation });
}

// GET /api/orders/location?orderId=...
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ message: 'Missing orderId' }, { status: 400 });
  const order = await Order.findById(orderId).select('deliveryLocation');
  if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  return NextResponse.json({ deliveryLocation: order.deliveryLocation });
}
