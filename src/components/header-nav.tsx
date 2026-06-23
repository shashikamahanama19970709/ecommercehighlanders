'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react';

export function HeaderNav() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for subtle header shadow enhancement
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith('#')) return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navLinks = [
    { label: 'Shop', href: '#catalog' },
    { label: 'Shop by Sport', href: '/shop-by-sport' },
    { label: 'Best Selling', href: '/best-selling' },
    { label: 'About Us', href: '/about' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`
              relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium
              transition-all duration-200 ease-out
              ${isActive(link.href)
                ? 'bg-[#0f1a2e] text-white shadow-md'
                : 'text-[#0f1a2e]/80 hover:bg-[#0f1a2e]/06 hover:text-[#0f1a2e]'
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2
            `}
          >
            {link.label}
            {isActive(link.href) && (
              <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#c8a84b]" />
            )}
          </Link>
        ))}

        {/* Cart */}
        <Link
          href="/cart"
          className="relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-[#0f1a2e]/80 hover:bg-[#0f1a2e]/06 hover:text-[#0f1a2e] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2"
          aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : 'Cart'}
        >
          <span className="relative">
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#c8a84b] text-[9px] font-bold text-white shadow-sm animate-pulse-gold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </span>
          <span>Cart</span>
        </Link>

        {/* Customer Login Button */}
        <Link
          href="/login"
          className={`
            ml-1 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold
            transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2
            ${isActive('/login')
              ? 'bg-[#0f1a2e] text-white shadow-md'
              : 'border-2 border-[#0f1a2e] text-[#0f1a2e] hover:bg-[#0f1a2e] hover:text-white'
            }
          `}
        >
          Sign In
        </Link>
      </nav>

      {/* Mobile: Cart + Hamburger */}
      <div className="flex items-center gap-2 md:hidden">
        {/* Cart Icon Mobile */}
        <Link
          href="/cart"
          className="relative inline-flex items-center justify-center rounded-full p-2.5 text-[#0f1a2e] transition-colors hover:bg-[#0f1a2e]/06 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
          aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : 'Cart'}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c8a84b] text-[9px] font-bold text-white">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        {/* Hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dde4ee] text-[#0f1a2e] transition-all duration-200 hover:bg-[#f0f4f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
        >
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              mobileOpen ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'
            }`}
          >
            <Menu className="h-5 w-5" />
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              mobileOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'
            }`}
          >
            <X className="h-5 w-5" />
          </span>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div
          className="absolute left-0 right-0 top-full z-50 border-t border-[#dde4ee] bg-white/97 shadow-xl backdrop-blur-md md:hidden animate-fade-up"
          style={{ animationDuration: '0.2s' }}
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-4">
            {/* Nav Links */}
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium
                    transition-colors duration-150
                    ${isActive(link.href)
                      ? 'bg-[#0f1a2e] text-white'
                      : 'text-[#0f1a2e] hover:bg-[#f0f4f8]'
                    }
                  `}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c8a84b]" />
                  )}
                </Link>
              ))}

              {/* Cart Mobile */}
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-[#0f1a2e] hover:bg-[#f0f4f8] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                </span>
                {cartCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c8a84b] px-1.5 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="mt-4 border-t border-[#dde4ee] pt-4">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-[#0f1a2e] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2"
              >
                Customer Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}