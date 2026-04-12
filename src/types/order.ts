import type { Product } from "./product";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  category: Product["category"];
  priceUsd: number;
  quantity: number;
}

export interface Order {
  _id?: string;
  userId?: string | null;
  email: string;
  currency: string; // e.g. USD, EUR, LKR
  items: OrderItemSnapshot[];
  totalUsd: number;
  status: OrderStatus;
  stripeSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStatsByDay {
  day: string; // YYYY-MM-DD
  totalUsd: number;
  orderCount: number;
}

export interface OrderStatsByMonth {
  month: string; // YYYY-MM
  totalUsd: number;
  orderCount: number;
}
