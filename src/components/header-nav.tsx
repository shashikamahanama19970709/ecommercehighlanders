'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart } from 'lucide-react';

export function HeaderNav() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="flex items-center text-sm font-medium text-foreground">
      <div className="hidden items-center gap-4 md:flex">
        <Link
          href="#catalog"
          className="cursor-pointer rounded-full px-3 py-1 text-xs hover:bg-muted transition-colors"
        >
          Shop
        </Link>
        <Link
          href="/shop-by-sport"
          className="cursor-pointer rounded-full px-3 py-1 text-xs hover:bg-muted transition-colors"
        >
          Shop by sport
        </Link>
        <Link
          href="/cart"
          className="cursor-pointer relative rounded-full px-3 py-1 text-xs hover:bg-muted transition-colors"
        >
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
              {cartCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin"
          className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
        >
          Admin
        </Link>
      </div>

      <details className="group relative md:hidden">
        <summary
          className="cursor-pointer list-none rounded-full border border-border p-2 hover:bg-muted transition-colors [&::-webkit-details-marker]:hidden"
          aria-label="Toggle menu"
        >
          <span className="relative block h-5 w-5">
            <svg
              className="absolute inset-0 h-5 w-5 transform transition-all duration-300 ease-in-out group-open:rotate-90 group-open:scale-95 group-open:opacity-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              className="absolute inset-0 h-5 w-5 transform opacity-0 -rotate-90 scale-95 transition-all duration-300 ease-in-out group-open:rotate-0 group-open:scale-100 group-open:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </span>
        </summary>

        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur">
          <Link href="#catalog" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
            Shop
          </Link>
          <Link href="/shop-by-sport" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
            Shop by sport
          </Link>
          <Link href="/cart" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
            Cart {cartCount > 0 && `(${cartCount})`}
          </Link>
          <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
            Admin
          </Link>
        </div>
      </details>
    </nav>
  );
}