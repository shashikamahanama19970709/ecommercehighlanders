import type { Coupon } from '@/types/coupon';

export const COUPONS: Coupon[] = [
  {
    code: 'WELCOME10',
    description: '10% off your first order',
    discountType: 'percent',
    amount: 10,
    isActive: true,
  },
  {
    code: 'FREESHIP',
    description: 'Free UK Standard Shipping',
    discountType: 'fixed',
    amount: 4.99,
    minOrderTotal: 30,
    isActive: true,
  },
];

export function validateCoupon(code: string, total: number): Coupon | null {
  const coupon = COUPONS.find(c => c.code.toLowerCase() === code.toLowerCase() && c.isActive);
  if (!coupon) return null;
  if (coupon.minOrderTotal && total < coupon.minOrderTotal) return null;
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) return null;
  return coupon;
}
