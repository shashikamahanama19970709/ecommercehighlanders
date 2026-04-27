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

function CheckoutPage() {
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

  // Load shipping options
  useEffect(() => {
    const opts = getShippingOptionsForCountry(selectedCountry);
    setShippingOptions(opts);
    setSelectedShipping(opts[0] || null);
  }, [selectedCountry]);

  // Calculate tax safely
  useEffect(() => {
    if (!selectedShipping) return;
    const { tax, rate } = calculateTax(items, selectedCountry, selectedShipping);
    setTax(tax);
    setTaxRate(rate);
  }, [items, selectedCountry, selectedShipping]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        items: items.map((i) => ({
          productId: String(i.product._id),
          quantity: i.quantity,
        })),
        shipping: selectedShipping
          ? { label: selectedShipping.label, cost: selectedShipping.cost }
          : undefined,
        tax: tax
          ? { label: `Tax (${(taxRate * 100).toFixed(0)}%)`, amount: tax }
          : undefined,
        discount: discount
          ? { label: appliedCoupon?.description || 'Discount', amount: discount }
          : undefined,
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

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Checkout</h1>

        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        <div className="grid gap-8 lg:grid-cols-2 mt-8">
          {/* LEFT */}
          <div>
            <h2 className="text-lg font-medium">Order Summary</h2>

            {/* ✅ Country moved here */}
            <div className="mt-4">
              <label className="text-sm font-medium">Country</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded mt-1"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              />
            </div>

            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div key={String(item.product._id)} className="flex gap-4 items-center">
                  <div className="h-12 w-12 relative">
                    {item.product.featureImageUrl && (
                      <Image src={item.product.featureImageUrl} alt="" fill />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm">
                      {item.product.name}
                    </h3>

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() =>
                          item.quantity > 1 &&
                          updateQuantity(String(item.product._id), item.quantity - 1)
                        }
                      >
                        -
                      </button>

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            String(item.product._id),
                            Number(e.target.value)
                          )
                        }
                        className="w-12 text-center"
                      />

                      <button
                        onClick={() =>
                          updateQuantity(String(item.product._id), item.quantity + 1)
                        }
                      >
                        +
                      </button>

                      <button onClick={() => removeFromCart(String(item.product._id))}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <p>£{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="mt-4 border-t pt-4">
              <p className="font-semibold">
                Total: £{(total + (selectedShipping?.cost || 0) - discount + tax).toFixed(2)}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <h2 className="text-lg font-medium">Shipping Info</h2>

            {authenticated ? (
              <AddressBook />
            ) : (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="mt-4 w-full bg-black text-white py-2"
            >
              Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;