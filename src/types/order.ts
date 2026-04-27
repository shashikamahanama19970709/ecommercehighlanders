export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  category?: string;
  priceUsd: number;
  quantity: number;
}

export interface DeliveryLocation {
  lat: number;
  lng: number;
  updatedAt: string;
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
  shipping?: { label: string; cost: number };
  tax?: { label: string; amount: number };
  discount?: { label: string; amount: number };
  deliveryLocation?: DeliveryLocation | null;
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
