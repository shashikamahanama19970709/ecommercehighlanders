import ImageWithFallback from '@/components/image-with-fallback';
import Link from 'next/link';
import type { Brand } from '@/types/product';
import { HeaderNav } from "@/components/header-nav";

async function fetchBrands() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/brands`, {
    cache: 'no-store',
  });

  if (!res.ok) return [] as Brand[];
  return (await res.json()) as Brand[];
}

export default async function BrandsPage() {
  const brands = await fetchBrands();
  const publishedBrands = (Array.isArray(brands) ? brands : []).filter((b) => b?.isPublished);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 shadow-sm transition-shadow duration-300 overflow-visible">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Brand Logo */}
            <Link href="/" className="cursor-pointer group flex items-center gap-2 shrink-0" aria-label="Highlanders Sports & Fitness Home">
              <div className="relative h-10 w-10 shrink-0">
                <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="brnd-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/>
                      <stop offset="50%" stopColor="#c8d4e4"/>
                      <stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="brnd-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/>
                      <stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="brnd-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/>
                      <stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#brnd-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#brnd-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#brnd-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#brnd-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              <div className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-sm font-bold tracking-widest uppercase text-[#0f1a2e] group-hover:text-[#1e3a5f] transition-colors">
                  Highlanders
                </span>
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{color:'#c8a84b'}}>
                  Sports &amp; Fitness
                </span>
              </div>
            </Link>

            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Spacing for fixed header */}
      <div className="h-16" aria-hidden="true" />

      {/* Main Content */}
      <main className="flex-1">
        {/* Banner Section */}
        <section className="relative py-16 overflow-hidden bg-[#0f1a2e] text-white">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#c8a84b]/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-[#1e3a5f]/40 blur-3xl pointer-events-none" />

          <div className="mx-auto w-full max-w-5xl px-6 relative z-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#c8a84b]">Authorized Stockists</span>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl text-white">
              Official Partners &amp; Brands
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
              We collaborate with the world&apos;s leading manufacturers of premium sports gear and fitness equipment to deliver genuine warranty protection and peak performance directly to your doorstep.
            </p>
          </div>
        </section>

        {/* Brands Grid Section */}
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {publishedBrands.map((brand) => (
              <Link
                key={brand._id}
                href={`/shop-by-sport?brandId=${brand._id}`}
                className="group flex flex-col items-center justify-center h-32 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                title={`Shop ${brand.name}`}
              >
                {brand.logoUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <ImageWithFallback
                      src={brand.logoUrl}
                      alt={brand.name}
                      width={140}
                      height={52}
                      className="max-h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-[#0f1a2e] flex items-center justify-center text-sm font-bold group-hover:bg-[#0f1a2e] group-hover:text-white transition-colors duration-300">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold tracking-tight text-slate-700 group-hover:text-[#c8a84b] transition-colors">{brand.name}</span>
                  </div>
                )}
              </Link>
            ))}

            {publishedBrands.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-16 text-center text-sm text-slate-400 font-semibold">
                No authorized brands published yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
