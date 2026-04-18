'use client';

import { useCart } from '@/lib/cart-context';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">Your Cart is Empty</h1>
            <p className="mt-2 text-muted-foreground">Add some products to get started.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground">Shopping Cart</h1>

        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={String(item.product._id)} className="flex items-center gap-4 rounded-lg border p-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
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
                <h3 className="font-medium text-foreground">
                  {typeof item.product.brand === 'object' ? item.product.brand.name : item.product.brand} - {item.product.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  £{item.product.price.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product._id!, item.quantity - 1)}
                  className="rounded-full p-1 hover:bg-muted"
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product._id!, item.quantity + 1)}
                  className="rounded-full p-1 hover:bg-muted"
                  disabled={item.quantity >= (item.product.stock || 0)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-right">
                <p className="font-medium">£{(item.product.price * item.quantity).toFixed(2)}</p>
              </div>

              <button
                onClick={() => removeFromCart(item.product._id!)}
                className="rounded-full p-1 text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-lg font-semibold">Total: £{total.toFixed(2)}</p>
          </div>
          <Link
            href="/checkout"
            className="rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}