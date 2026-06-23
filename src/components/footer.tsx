"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ShopBySportModule } from '@/types/shop-by-sport';
import type { Sport } from '@/types/product';

async function fetchShopBySportModule(signal?: AbortSignal) {
  const res = await fetch('/api/shop-by-sport', { cache: 'no-store', signal });
  if (!res.ok) return null;
  return (await res.json()) as ShopBySportModule;
}

const SocialIcon = ({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    aria-label={label}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex h-9 w-9 items-center justify-center rounded-full border text-white transition-all duration-200 hover:scale-110"
    style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLAnchorElement).style.borderColor = '#c8a84b';
      (e.currentTarget as HTMLAnchorElement).style.color = '#c8a84b';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.15)';
      (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)';
    }}
  >
    {children}
  </a>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link
      href={href}
      className="group flex items-center gap-1.5 text-sm transition-colors duration-200"
      style={{ color: 'rgba(255,255,255,0.55)' }}
    >
      <span
        className="inline-block h-px w-0 rounded-full transition-all duration-200 group-hover:w-3"
        style={{ background: '#c8a84b' }}
      />
      <span className="group-hover:text-[#c8a84b] transition-colors duration-200">{children}</span>
    </Link>
  </li>
);

const LogoMark = ({ id }: { id: string }) => (
  <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-silver`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8edf5" />
        <stop offset="100%" stopColor="#8898b0" />
      </linearGradient>
      <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4a84b" />
        <stop offset="100%" stopColor="#9a6e08" />
      </linearGradient>
      <linearGradient id={`${id}-navy`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3a5f8a" />
        <stop offset="100%" stopColor="#1e3a5f" />
      </linearGradient>
    </defs>
    <polygon points="6,62 26,18 46,62" fill={`url(#${id}-silver)`} />
    <polygon points="24,62 44,8 64,62" fill={`url(#${id}-silver)`} opacity="0.75" />
    <polygon points="44,8 39,24 49,24" fill="white" opacity="0.9" />
    <path
      d="M4,68 Q22,52 42,60 Q58,66 74,52"
      stroke={`url(#${id}-gold)`}
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M4,74 Q24,62 44,68 Q60,73 76,60"
      stroke={`url(#${id}-navy)`}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

export default function Footer() {
  const [shopBySportModule, setShopBySportModule] = useState<ShopBySportModule | null>(null);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'submitted'>('idle');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const data = await fetchShopBySportModule(controller.signal);
        setShopBySportModule(data);
      } catch {
        if (controller.signal.aborted) return;
        setShopBySportModule(null);
      }
    })();
    return () => controller.abort();
  }, []);

  const sports = useMemo(() => {
    if (!Array.isArray(shopBySportModule?.entries)) return [];
    return shopBySportModule!.entries
      .map((entry) => entry.sport)
      .filter(
        (sport): sport is Sport =>
          !!sport &&
          typeof sport === 'object' &&
          typeof (sport as any)._id === 'string' &&
          typeof (sport as any).name === 'string'
      )
      .filter((sport, index, self) => self.findIndex((s) => s._id === sport._id) === index);
  }, [shopBySportModule]);

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d1625 0%, #080e1a 100%)' }}
    >
      {/* Gold accent line at top */}
      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #c8a84b 30%, #f0c870 50%, #c8a84b 70%, transparent 100%)',
        }}
      />

      {/* Newsletter Banner */}
      <div
        className="border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: 'rgba(30,58,95,0.25)',
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="text-lg font-bold tracking-wide text-white">Stay in the Game</p>
              <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Get exclusive deals, new arrivals &amp; training tips.
              </p>
            </div>
            {subStatus === 'submitted' ? (
              <div
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
                style={{ background: 'rgba(200,168,75,0.15)', color: '#c8a84b' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                You&apos;re subscribed!
              </div>
            ) : (
              <form
                className="flex w-full max-w-sm gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubStatus('submitted');
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 rounded-full border px-4 py-2.5 text-sm text-white outline-none transition-all"
                  style={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                  }}
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 focus:outline-none"
                  style={{
                    background: 'linear-gradient(135deg, #d4a84b 0%, #f0c870 50%, #c8a84b 100%)',
                    color: '#0f1a2e',
                  }}
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="group mb-5 inline-flex items-center gap-3">
              <div className="h-10 w-10 shrink-0">
                <LogoMark id="ft" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold uppercase tracking-widest text-white">
                  Highlanders
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: '#c8a84b' }}
                >
                  Sports &amp; Fitness
                </span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Train Like a Champion. Premium sports gear and fitness equipment for athletes of every
              level.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-2">
              <SocialIcon href="https://www.facebook.com" label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com" label="Instagram">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.twitter.com" label="Twitter / X">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.youtube.com" label="YouTube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                  <polygon fill="#080e1a" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* Shop by Sport */}
          <div>
            <h4
              className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white"
            >
              Shop by Sport
            </h4>
            <ul className="space-y-2.5">
              {sports.length > 0 ? (
                sports.slice(0, 6).map((sport) => (
                  <FooterLink key={sport._id} href="/shop-by-sport">
                    {sport.name}
                  </FooterLink>
                ))
              ) : (
                <>
                  <FooterLink href="/shop-by-sport">Cricket</FooterLink>
                  <FooterLink href="/shop-by-sport">Football</FooterLink>
                  <FooterLink href="/shop-by-sport">Gym &amp; Fitness</FooterLink>
                  <FooterLink href="/shop-by-sport">Rugby</FooterLink>
                  <FooterLink href="/shop-by-sport">Badminton</FooterLink>
                </>
              )}
              <FooterLink href="/shop-by-sport">View All Sports →</FooterLink>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white">
              Customer Support
            </h4>
            <ul className="space-y-2.5">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/help">Help Center</FooterLink>
              <FooterLink href="/shipping">Shipping Info</FooterLink>
              <FooterLink href="/returns">Returns &amp; Exchanges</FooterLink>
              <FooterLink href="/order-lookup">Track My Order</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0" style={{ color: '#c8a84b' }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  71-75 Shelton Street,
                  <br />
                  London, WC2H 9JQ
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="shrink-0" style={{ color: '#c8a84b' }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </span>
                <a
                  href="tel:+447491807132"
                  className="text-sm transition-colors hover:text-[#c8a84b]"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  +44 7491807132
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="shrink-0" style={{ color: '#c8a84b' }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <a
                  href="mailto:info@highlanderssports.lk"
                  className="text-sm transition-colors hover:text-[#c8a84b]"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  info@highlanderssports.lk
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="shrink-0" style={{ color: '#c8a84b' }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7"
                    />
                  </svg>
                </span>
                <a
                  href="https://maps.google.com/?q=71-75+Shelton+Street,+London,+WC2H+9JQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:text-[#c8a84b]"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  View on Google Maps
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto w-full max-w-7xl px-6 py-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              &copy; {currentYear} Highlanders Sports &amp; Fitness. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Secure Checkout
                </span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Powered by{' '}
                <a
                  href="https://flexnodelive.site/"
                  className="transition-colors hover:text-[#c8a84b]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FlexNode
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}