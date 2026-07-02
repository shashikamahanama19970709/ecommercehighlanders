'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { ShoppingCart, Menu, X, ChevronDown, Globe, LogOut, LayoutDashboard, History } from 'lucide-react';
import { CurrencyDropdown } from './currency-dropdown';

export function HeaderNav() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const { items } = useCart();
  const { currencies, selectedCurrency, changeCurrency } = useCurrency();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for subtle header shadow enhancement
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const [activeHash, setActiveHash] = useState('');
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [pathname]);

  // Smooth scroll automatically when navigating from another page to home page with a hash
  useEffect(() => {
    if (pathname === '/' && lastPathname.current !== '/' && typeof window !== 'undefined' && window.location.hash) {
      const targetId = window.location.hash.substring(1);
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        setActiveHash(window.location.hash);
      }, 350);
      return () => clearTimeout(timer);
    }
    lastPathname.current = pathname;
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.includes('#')) {
      const hash = href.substring(href.indexOf('#'));
      return pathname === '/' && activeHash === hash;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.substring(2);
      if (pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        window.history.pushState({}, '', href);
        setActiveHash(`#${targetId}`);
      }
    }
  };

  const navLinks = [
    { label: 'Categories', href: '/#categories' },
    { label: 'Shop by Sport', href: '/#shop-by-sport' },
    { label: 'Brands', href: '/#brands' },
    { label: 'Best Selling', href: '/best-selling' },
    { label: 'About Us', href: '/#about-us' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className={`
              relative inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold
              transition-all duration-200 ease-out
              ${isActive(link.href)
                ? 'text-[#0f1a2e]'
                : 'text-slate-600 hover:text-[#0f1a2e]'
              }
              focus-visible:outline-none
            `}
          >
            {link.label}
            {isActive(link.href) && (
              <span className="absolute bottom-0.5 left-4 right-4 h-0.5 rounded-full bg-[#c8a84b]" />
            )}
          </Link>
        ))}

        {/* Currency Selector */}
        <CurrencyDropdown align="right" className="ml-2" />

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

        {/* Customer Login Button & Profile Menu */}
        {session?.user ? (
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#1e3a5f] to-[#0f1a2e] text-white font-bold text-sm border border-[#dde4ee] shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              aria-label="User menu"
            >
              {session.user.image ? (
                <img src={session.user.image} alt="User Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span>{(session.user.name || session.user.email || 'U')[0].toUpperCase()}</span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-[#dde4ee] bg-white p-4 shadow-xl z-50 animate-fade-in-up">
                <div className="border-b border-[#dde4ee] pb-3 mb-3 text-left">
                  <p className="text-sm font-bold text-[#0f1a2e] truncate">{session.user.name || 'User'}</p>
                  <p className="text-xs text-[#64748b] truncate">{session.user.email}</p>
                  <span className="mt-1.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700 tracking-wider">
                    {(session.user as any).role || 'Customer'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  {/* If admin, show Admin Dashboard link */}
                  {(session.user as any).role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f1a2e] hover:bg-[#f0f4f8] transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Admin Dashboard
                    </Link>
                  )}
                  
                  {/* Order History Link */}
                  <Link
                    href="/order-lookup"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#0f1a2e] hover:bg-[#f0f4f8] transition-colors"
                  >
                    <History className="h-3.5 w-3.5" />
                    My Orders
                  </Link>

                  {/* Sign Out */}
                  <button
                    type="button"
                    onClick={async () => {
                      setDropdownOpen(false);
                      await signOut({ redirect: false });
                      window.location.href = '/';
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}
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
                  onClick={(e) => {
                    handleNavClick(e, link.href);
                    setMobileOpen(false);
                  }}
                  className={`
                    flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold
                    transition-colors duration-150
                    ${isActive(link.href)
                      ? 'text-[#0f1a2e] bg-slate-50'
                      : 'text-slate-600 hover:bg-[#f0f4f8]'
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

              {/* Currency Mobile */}
              <CurrencyDropdown isMobile={true} />
            </nav>

            {/* Mobile Authentication / Profile Section */}
            <div className="mt-4 border-t border-[#dde4ee] pt-4">
              {session?.user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-[#f8fafc] p-3 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1e3a5f] to-[#0f1a2e] text-white font-bold text-sm">
                      {session.user.image ? (
                        <img src={session.user.image} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span>{(session.user.name || session.user.email || 'U')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-bold text-[#0f1a2e] truncate">{session.user.name || 'User'}</p>
                      <p className="text-xs text-[#64748b] truncate">{session.user.email}</p>
                      <span className="mt-0.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-700">
                        {(session.user as any).role || 'Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {(session.user as any).role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#0f1a2e] hover:bg-[#f0f4f8] transition-colors"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      href="/order-lookup"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#0f1a2e] hover:bg-[#f0f4f8] transition-colors"
                    >
                      <History className="h-3.5 w-3.5" />
                      My Orders
                    </Link>

                    <button
                      type="button"
                      onClick={async () => {
                        setMobileOpen(false);
                        await signOut({ redirect: false });
                        window.location.href = '/';
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-100 py-3 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-[#0f1a2e] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2"
                >
                  Customer Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}