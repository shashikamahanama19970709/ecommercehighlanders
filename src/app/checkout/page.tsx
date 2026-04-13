'use client';

import { useCart } from '@/lib/cart-context';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    // Simulate order placement
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearCart();
    router.push('/order-confirmation');
  };

  if (items.length === 0) {
    return (
      <div className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">No Items to Checkout</h1>
            <p className="mt-2 text-muted-foreground">Your cart is empty.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground">Checkout</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div key={item.product._id} className="flex items-center gap-4">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.product.featureImageUrl ? (
                      <Image
                        src={item.product.featureImageUrl}
                        alt={item.product.name || 'Product'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">
                      {typeof item.product.brand === 'object' ? item.product.brand.name : item.product.brand} - {item.product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {item.quantity} × ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-foreground">Shipping Information</h2>
            <form className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Address</label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
            </form>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="mt-6 w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}