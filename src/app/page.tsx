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

async function fetchSports() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/sports`, {
    cache: "no-store",
  });

  if (!res.ok) return [] as Sport[];
  return (await res.json()) as Sport[];
}

async function fetchBrands() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/brands`, {
    cache: "no-store",
  });

  if (!res.ok) return [] as Brand[];
  return (await res.json()) as Brand[];
}

async function fetchShopBySportModule() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/shop-by-sport`, {
    cache: "no-store",
  });

  if (!res.ok) return null as ShopBySportModule | null;
  return (await res.json()) as ShopBySportModule;
}

async function fetchAboutUsModule() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/landing/about-us`, {
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
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="cursor-pointer flex items-center gap-3">
              <span className="relative">
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 bg-foreground shadow-lg sm:h-20 sm:w-20"
                  style={{
                    clipPath:
                      "polygon(25% 6%, 75% 6%, 96% 50%, 75% 94%, 25% 94%, 4% 50%)",
                  }}
                  aria-hidden="true"
                />
                <span className="relative z-10 grid h-12 w-12 place-items-center text-background sm:h-14 sm:w-14">
                  <span className="text-sm font-semibold sm:text-base">S</span>
                </span>
              </span>
              <span className="hidden text-lg font-semibold tracking-tight text-foreground sm:inline">
                Sportify Shop
              </span>
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
