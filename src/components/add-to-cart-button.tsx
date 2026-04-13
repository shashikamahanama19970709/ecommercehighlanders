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

  return (
    <button
      type="button"
      disabled={(product.stock || 0) <= 0}
      className={`cursor-pointer inline-flex items-center rounded-full bg-foreground p-1 text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${className || ''}`}
      onClick={() => addToCart(product)}
    >
      <ShoppingCart size={size} />
    </button>
  );
}