import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import type { Order } from "@/types/order";

// GET /api/orders - list all orders (admin usage)
export async function GET() {
  const ordersCol = await getCollection<Order>("orders");
  const orders = await ordersCol.find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(orders);
}

// POST /api/orders - create order after successful Stripe checkout or COD
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ordersCol = await getCollection<Order>("orders");

    const now = new Date().toISOString();

    const order: Order = {
      email: body.email,
      userId: body.userId ?? null,
      currency: body.currency,
      items: body.items,
      totalUsd: Number(body.totalUsd),
      status: body.status ?? "paid",
      stripeSessionId: body.stripeSessionId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await ordersCol.insertOne(order as Order);

    return NextResponse.json({ ...order, _id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("Error creating order", error);
    return NextResponse.json({ message: "Error creating order" }, { status: 500 });
  }
}
