'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart } from 'lucide-react';

export function HeaderNav() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const basePill =
    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-colors ' +
    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const isActive = (href: string) => {
    if (href.startsWith('#')) return pathname === '/';
    return pathname === href;
  };

  const pillClass = (href: string, extra?: string) =>
    `${basePill} ${isActive(href) ? 'bg-muted text-foreground' : 'text-foreground'}${extra ? ` ${extra}` : ''}`;

  const closeMobileMenu = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <nav className="flex items-center text-sm font-medium text-foreground">
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="#catalog"
          className={pillClass('#catalog')}
        >
          Shop
        </Link>
        <Link
          href="/shop-by-sport"
          className={pillClass('/shop-by-sport')}
        >
          Shop by sport
        </Link>
        <Link
          href="/cart"
          className={pillClass('/cart', 'relative pr-4')}
          aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : 'Cart'}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
              {cartCount}
            </span>
          )}
        </Link>
        <Link
          href="/login"
          className={pillClass('/login', 'border border-border')}
        >
          Customer Login
        </Link>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <Link
          href="/cart"
          className="relative inline-flex items-center justify-center rounded-full border border-border p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : 'Cart'}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
              {cartCount}
            </span>
          )}
        </Link>

        <details ref={detailsRef} className="group relative">
          <summary
            className={
              'cursor-pointer list-none rounded-full border border-border p-2 transition-colors ' +
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden'
            }
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

          <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur">
            <Link
              href="#catalog"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Shop
            </Link>
            <Link
              href="/shop-by-sport"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Shop by sport
            </Link>
            <Link
              href="/cart"
              onClick={closeMobileMenu}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Cart
              </span>
              {cartCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-medium text-background">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Customer Login
            </Link>
          </div>
        </details>
      </div>
    </nav>
  );
}