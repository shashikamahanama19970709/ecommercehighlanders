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
  const sessions = await col.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'orders',
        localField: 'stripeSessionId',
        foreignField: 'stripeSessionId',
        as: 'associatedOrder'
      }
    },
    {
      $addFields: {
        orderStatus: { $arrayElemAt: ['$associatedOrder.status', 0] }
      }
    },
    {
      $project: {
        associatedOrder: 0
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: 100 }
  ]).toArray();

  return NextResponse.json({ sessions });
}
