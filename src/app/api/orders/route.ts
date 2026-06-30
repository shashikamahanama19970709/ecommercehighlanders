import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import type { Order } from "@/types/order";
import { auth } from "@/auth";

// GET /api/orders - list orders (filters by user email if not admin)
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const role = (session.user as any).role || "customer";

  const ordersCol = await getCollection<Order>("orders");
  
  let query = {};
  if (role !== "admin") {
    query = { email };
  }

  const orders = await ordersCol.find(query).sort({ createdAt: -1 }).toArray();
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
