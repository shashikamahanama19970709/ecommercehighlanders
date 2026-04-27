export interface Coupon {
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  amount: number;
  minOrderTotal?: number;
  expiresAt?: string;
  isActive: boolean;
}
