'use client';

import { useCart } from '@/lib/cart-context';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/use-user';
import Image from 'next/image';
import { getShippingOptionsForCountry } from '@/lib/shipping-options';
import type { ShippingOption } from '@/types/shipping-option';
import { calculateTax } from '@/lib/tax';
import { NoticeBanner, type Notice } from '@/components/notice-banner';
import { AddressBook } from '@/components/address-book';

type Coupon = {
  code: string;
  description: string;
};

export default function CheckoutPage() {
  const { items, total, updateQuantity, removeFromCart } = useCart();
  const { user, loading: userLoading, authenticated } = useUser();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  const [tax, setTax] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');

  // Load shipping options whenever country changes
  useEffect(() => {
    const opts = getShippingOptionsForCountry(selectedCountry);
    setShippingOptions(opts);
    setSelectedShipping(opts[0] || null);
  }, [selectedCountry]);

  // Calculate tax when items or shipping changes
  useEffect(() => {
    if (!selectedShipping) return;
    const { tax: calculatedTax, rate } = calculateTax(items, selectedCountry, selectedShipping);
    setTax(calculatedTax);
    setTaxRate(rate);
  }, [items, selectedCountry, selectedShipping]);

  useEffect(() => setMounted(true), []);

  if (!mounted || userLoading) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'SAVE10') {
      setDiscount(total * 0.1);
      setAppliedCoupon({ code: 'SAVE10', description: '10% off' });
    } else {
      setDiscount(0);
      setAppliedCoupon(null);
      setNotice({ type: 'error', message: 'Invalid coupon code.' });
    }
  };

  const handlePlaceOrder = async () => {
    setNotice(null);
    const finalEmail = (authenticated ? user?.email : email)?.trim();
    if (!finalEmail) {
      setNotice({ type: 'error', message: 'Checkout email is required.' });
      return;
    }
    setIsPlacingOrder(true);
    try {
      const payload = {
        email: finalEmail,
        currency: 'gbp',
        items: items.map(i => ({ productId: String(i.product._id), quantity: i.quantity })),
        shipping: selectedShipping ? { label: selectedShipping.label, cost: selectedShipping.cost } : undefined,
        tax: tax ? { label: `Tax (${(taxRate * 100).toFixed(0)}%)`, amount: tax } : undefined,
        discount: discount ? { label: appliedCoupon?.description || 'Discount', amount: discount } : undefined,
      };
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => ({}));
        setNotice({ type: 'error', message: out?.message ?? 'Checkout failed.' });
        return;
      }
      const out = await res.json();
      if (!out?.url) {
        setNotice({ type: 'error', message: 'Checkout failed.' });
        return;
      }
      window.location.href = out.url;
    } catch {
      setNotice({ type: 'error', message: 'Checkout failed.' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 text-center py-16">
        <h1 className="text-2xl font-semibold">No Items to Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  const subtotal = total;
  const shippingCost = selectedShipping?.cost ?? 0;
  const finalTotal = subtotal + shippingCost - discount + tax;

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
        <div className="grid gap-8 lg:grid-cols-2 mt-8">
          {/* LEFT – Order Review */}
          <section className="space-y-6">
            <h2 className="text-lg font-medium">Order Review</h2>
            {/* Items */}
            <div className="space-y-4">
              {items.map(item => (
                <div key={String(item.product._id)} className="flex gap-4 items-start border rounded-lg p-3">
                  <div className="h-16 w-16 relative flex-shrink-0">
                    {item.product.featureImageUrl && (
                      <Image src={item.product.featureImageUrl} alt={`${item.product.name} image`} fill className="object-cover" sizes="100vw" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{item.product.name}</h3>
                    {item.product.sku && (
                      <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                    )}
                    <div className="flex items-center mt-2 space-x-2">
                      <button
                        className="px-2 py-1 bg-gray-200 rounded"
                        onClick={() => item.quantity > 1 && updateQuantity(String(item.product._id), item.quantity - 1)}
                      >-</button>
                      <input
                        type="number"
                        min={1}
                        className="w-12 text-center border rounded"
                        value={item.quantity}
                        onChange={e => updateQuantity(String(item.product._id), Number(e.target.value))}
                      />
                      <button
                        className="px-2 py-1 bg-gray-200 rounded"
                        onClick={() => updateQuantity(String(item.product._id), item.quantity + 1)}
                      >+</button>
                      <button
                        className="text-sm text-red-600 underline ml-3"
                        onClick={() => removeFromCart(String(item.product._id))}
                      >Remove</button>
                    </div>
                  </div>
                  <p className="font-medium">£{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            {/* Promo Code */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2 items-center border rounded p-3">
              <input
                type="text"
                placeholder="Promo code"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
              />
              <button
                type="submit"
                className="px-4 py-1 bg-indigo-600 text-white rounded"
                disabled={isPlacingOrder}
              >Apply</button>
            </form>
            {/* Price Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>£{shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>£{tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-£{discount.toFixed(2)}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>£{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* RIGHT – Fulfillment & Payment */}
          <section className="space-y-6">
            <h2 className="text-lg font-medium">Shipping & Payment</h2>
            {/* Address */}
            <div className="border rounded p-4">
              <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
              {authenticated ? (
                <AddressBook />
              ) : (
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              )}
            </div>
            {/* Shipping Method */}
            <div className="border rounded p-4">
              <h3 className="text-sm font-medium mb-2">Shipping Method</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {shippingOptions.map(opt => (
                  <label key={opt.id} className={`flex items-center border rounded p-3 cursor-pointer hover:shadow-sm transition ${selectedShipping?.id === opt.id ? 'border-indigo-600' : 'border-gray-300'}`}>
                    <input
                      type="radio"
                      name="shipping"
                      className="hidden"
                      checked={selectedShipping?.id === opt.id}
                      onChange={() => setSelectedShipping(opt)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.estimate ?? ''}</p>
                    </div>
                    <span className="ml-2 font-medium">£{opt.cost.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Payment Method */}
            <div className="border rounded p-4">
              <h3 className="text-sm font-medium mb-2">Payment Method</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card number"
                  className="w-full border rounded px-3 py-2"
                />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="w-24 border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
            {/* Place Order */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}