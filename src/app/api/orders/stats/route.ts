import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { Order } from "@/types/order";

// GET /api/orders/stats - totals by day and month in USD
export async function GET() {
  const ordersCol = await getCollection<Order>("orders");

  const orders = await ordersCol.find({ status: "paid" }).toArray();

  const byDay = new Map<string, { totalUsd: number; orderCount: number }>();
  const byMonth = new Map<string, { totalUsd: number; orderCount: number }>();

  for (const order of orders) {
    if (!order.createdAt) continue;
    const date = new Date(order.createdAt);

    const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM

    const dayAgg = byDay.get(dayKey) ?? { totalUsd: 0, orderCount: 0 };
    dayAgg.totalUsd += order.totalUsd;
    dayAgg.orderCount += 1;
    byDay.set(dayKey, dayAgg);

    const monthAgg = byMonth.get(monthKey) ?? { totalUsd: 0, orderCount: 0 };
    monthAgg.totalUsd += order.totalUsd;
    monthAgg.orderCount += 1;
    byMonth.set(monthKey, monthAgg);
  }

  const statsByDay = Array.from(byDay.entries()).map(([day, v]) => ({
    day,
    totalUsd: v.totalUsd,
    orderCount: v.orderCount,
  }));

  const statsByMonth = Array.from(byMonth.entries()).map(([month, v]) => ({
    month,
    totalUsd: v.totalUsd,
    orderCount: v.orderCount,
  }));

  return NextResponse.json({ statsByDay, statsByMonth });
}
