'use client';

import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import Image from 'next/image';
import ImageWithFallback from '@/components/image-with-fallback';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, total } = useCart();
  const { formatPrice } = useCurrency();

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
    <div className="flex-1 bg-[#f8fafc] min-h-[85vh]">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f1a2e]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Continue Shopping</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-[#0f1a2e]">Shopping Cart</h1>

        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={String(item.product._id)} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border p-4">
              {/* Top Row: Image & Details */}
              <div className="flex gap-4 items-center flex-1 min-w-0">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product.featureImageUrl ? (
                    <ImageWithFallback
                      src={item.product.featureImageUrl}
                      alt={item.product.name || 'Product'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground bg-slate-50">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                    {typeof item.product.brand === 'object' ? item.product.brand.name : item.product.brand} - {item.product.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {formatPrice(item.product.price)}
                  </p>
                </div>

                {/* Mobile Delete Button */}
                <button
                  onClick={() => removeFromCart(item.product._id!)}
                  className="rounded-full p-2 text-destructive hover:bg-destructive/10 sm:hidden cursor-pointer shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Bottom Row on Mobile, Side on Desktop */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                {/* Qty controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product._id!, item.quantity - 1)}
                    className="rounded-full p-1.5 hover:bg-muted border border-slate-200 transition-colors disabled:opacity-40"
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product._id!, item.quantity + 1)}
                    className="rounded-full p-1.5 hover:bg-muted border border-slate-200 transition-colors"
                    disabled={item.quantity >= (item.product.stock || 999)}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Total Price */}
                <div className="text-right min-w-[80px]">
                  <p className="text-[10px] font-semibold text-muted-foreground sm:hidden mb-0.5 uppercase tracking-wider">Total:</p>
                  <p className="font-bold text-[#0f1a2e] text-sm sm:text-base">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>

                {/* Desktop Delete Button */}
                <button
                  onClick={() => removeFromCart(item.product._id!)}
                  className="rounded-full p-2 text-destructive hover:bg-destructive/10 hidden sm:inline-flex cursor-pointer transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border p-4 text-center sm:text-left">
          <div>
            <p className="text-base sm:text-lg font-bold text-[#0f1a2e]">Total: {formatPrice(total)}</p>
          </div>
          <Link
            href="/checkout"
            className="w-full sm:w-auto rounded-full bg-foreground px-6 py-2.5 text-center text-sm font-semibold text-background hover:bg-foreground/90 transition-all shadow-md"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}