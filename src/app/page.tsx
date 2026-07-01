import Link from "next/link";
import { PopularCategories } from "@/components/popular-categories";
import { ShopBySportLandingSection } from "@/components/shop-by-sport-landing";
import { BrandsLandingSection } from "@/components/brands-landing";
import { AboutUsLandingSection } from "@/components/about-us-landing";
import { LandingVideoHero } from "@/components/landing-video-hero";
import { HeaderNav } from "@/components/header-nav";
import type { Brand, Sport } from "@/types/product";
import type { ShopBySportModule } from "@/types/shop-by-sport";
import type { AboutUsModule } from "@/types/about-us";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "https://ecommercehighlanders-production-8cbc.up.railway.app";
}

async function fetchSports() {
  const res = await fetch(`${getBaseUrl()}/api/sports`, {
    cache: "no-store",
  });

  if (!res.ok) return [] as Sport[];
  return (await res.json()) as Sport[];
}

async function fetchBrands() {
  const res = await fetch(`${getBaseUrl()}/api/brands`, {
    cache: "no-store",
  });

  if (!res.ok) return [] as Brand[];
  return (await res.json()) as Brand[];
}

async function fetchShopBySportModule() {
  const res = await fetch(`${getBaseUrl()}/api/shop-by-sport`, {
    cache: "no-store",
  });

  if (!res.ok) return null as ShopBySportModule | null;
  return (await res.json()) as ShopBySportModule;
}

async function fetchAboutUsModule() {
  const res = await fetch(`${getBaseUrl()}/api/landing/about-us`, {
    cache: "no-store",
  });

  if (!res.ok) return null as AboutUsModule | null;
  return (await res.json()) as AboutUsModule;
}

export default async function Home() {
  const sports = await fetchSports();
  const brands = await fetchBrands();
  const shopBySportModule = await fetchShopBySportModule();
  const aboutUsModule = await fetchAboutUsModule();

  return (
    <div className="flex-1">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 shadow-sm transition-shadow duration-300 overflow-visible">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="cursor-pointer group flex items-center gap-2 shrink-0" aria-label="Highlanders Sports & Fitness Home">
              {/* SVG Logo Mark */}
              <div className="relative h-10 w-10 shrink-0">
                <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/>
                      <stop offset="50%" stopColor="#c8d4e4"/>
                      <stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/>
                      <stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/>
                      <stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  {/* Left mountain */}
                  <polygon points="6,62 26,18 46,62" fill="url(#hdr-silver)"/>
                  {/* Right mountain (taller) */}
                  <polygon points="24,62 44,8 64,62" fill="url(#hdr-silver)" opacity="0.85"/>
                  {/* Snow cap */}
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  {/* Gold wave */}
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  {/* Navy wave */}
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              {/* Brand text */}
              <div className="hidden sm:flex flex-col leading-tight">
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

      <div className="h-16" aria-hidden="true" />
      <LandingVideoHero />

      <main className="pb-16 pt-0">
        <section className="bg-gradient-to-b from-muted/50 via-background to-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <PopularCategories sports={sports} />
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <ShopBySportLandingSection moduleDoc={shopBySportModule} />
          </div>
        </section>

        <section className="bg-gradient-to-b from-muted/50 via-background to-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <BrandsLandingSection brands={brands} shopBySportModule={shopBySportModule} />
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <AboutUsLandingSection moduleDoc={aboutUsModule} />
          </div>
        </section>
      </main>
    </div>
  );
}
