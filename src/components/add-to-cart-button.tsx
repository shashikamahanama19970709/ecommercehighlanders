'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import type { Product } from '@/types/product';

interface AddToCartButtonProps {
  product: Product;
  size?: number;
  className?: string;
}

export function AddToCartButton({ product, size = 14, className }: AddToCartButtonProps) {
  const { addToCart, items } = useCart();
  const hasId = typeof product._id === 'string' ? product._id.trim() !== '' : Boolean(product._id);

  const productId = hasId ? String(product._id) : '';
  const existingQuantity = productId
    ? (items.find((item) => String(item.product._id) === productId)?.quantity ?? 0)
    : 0;
  const stockLimit = typeof (product as any)?.stock === 'number' && Number.isFinite((product as any).stock)
    ? Math.max(0, Math.floor((product as any).stock))
    : null;

  const isOutOfStock = stockLimit !== null && stockLimit <= 0;
  const isAtLimit = stockLimit !== null && existingQuantity >= stockLimit;
  const isDisabled = !hasId || isOutOfStock || isAtLimit;

  const handleClick = () => {
    const didAdd = addToCart(product);
    if (!didAdd) return;

    if (!hasId) return;

    // Fire-and-forget API call so you can track cart changes server-side.
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ADD', productId: String(product._id), quantity: 1 }),
      keepalive: true,
    }).catch(() => {
      // Ignore network errors; cart UI remains functional.
    });
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`cursor-pointer inline-flex items-center rounded-full bg-foreground p-1 text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${className || ''}`}
      onClick={handleClick}
      title={
        !hasId
          ? 'Unavailable'
          : isOutOfStock
            ? 'Out of stock'
            : isAtLimit
              ? 'Stock limit reached'
              : 'Add to cart'
      }
    >
      <ShoppingCart size={size} />
    </button>
  );
}