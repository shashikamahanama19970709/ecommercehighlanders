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
  const { addToCart } = useCart();
  const hasId = typeof product._id === 'string' ? product._id.trim() !== '' : Boolean(product._id);

  const handleClick = () => {
    addToCart(product);

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
      disabled={!hasId}
      className={`cursor-pointer inline-flex items-center rounded-full bg-foreground p-1 text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${className || ''}`}
      onClick={handleClick}
    >
      <ShoppingCart size={size} />
    </button>
  );
}