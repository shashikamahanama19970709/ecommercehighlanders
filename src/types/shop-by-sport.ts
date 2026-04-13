import type { Product, Sport } from "./product";

export interface ShopBySportEntry {
  sport: Sport | string;
  heroImageKey?: string;
  heroImageUrl?: string;
  productIds: (string | Product)[];
  products?: Product[];
}

export interface ShopBySportModule {
  _id?: string;
  entries: ShopBySportEntry[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
