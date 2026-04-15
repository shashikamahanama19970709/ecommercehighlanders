'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Brand } from '@/types/product';
import type { ShopBySportModule } from '@/types/shop-by-sport';

type Props = {
  brands: Brand[];
  shopBySportModule: ShopBySportModule | null;
};

function getSportName(value: unknown): string {
  if (!value) return 'Sport';
  if (typeof value === 'string') return 'Sport';
  const maybe = value as { name?: string };
  return maybe.name?.trim() || 'Sport';
}

export function BrandsLandingSection({ brands, shopBySportModule }: Props) {
  const publishedBrands = useMemo(() => {
    return (Array.isArray(brands) ? brands : []).filter((b) => b?.isPublished);
  }, [brands]);

  const heroSlides = useMemo(() => {
    const entries = Array.isArray(shopBySportModule?.entries) ? shopBySportModule!.entries : [];
    return entries
      .map((entry) => {
        const heroImageUrl = entry.heroImageUrl;
        if (!heroImageUrl) return null;
        return {
          heroImageUrl,
          sportName: getSportName(entry.sport),
        };
      })
      .filter((s): s is { heroImageUrl: string; sportName: string } => !!s);
  }, [shopBySportModule]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [brandPage, setBrandPage] = useState(0);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => window.clearInterval(id);
  }, [heroSlides.length]);

  const brandsPerPage = 9;
  const brandPages = Math.max(1, Math.ceil(publishedBrands.length / brandsPerPage));
  const safeBrandPage = Math.min(brandPage, brandPages - 1);
  const visibleBrands = publishedBrands.slice(
    safeBrandPage * brandsPerPage,
    safeBrandPage * brandsPerPage + brandsPerPage
  );

  const goToPrev = () => {
    setBrandPage((prev) => (prev - 1 + brandPages) % brandPages);
  };

  const goToNext = () => {
    setBrandPage((prev) => (prev + 1) % brandPages);
  };

  if (publishedBrands.length === 0 && heroSlides.length === 0) return null;

  const safeActiveIndex = Math.min(activeIndex, Math.max(heroSlides.length - 1, 0));

  return (
    <section>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:grid-rows-[auto_1fr] lg:items-start">
        {/* Left column: Row 1 (title + arrows) */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Brands</h2>
          {brandPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={goToPrev}
                className="rounded-full border border-border bg-background/80 p-2 backdrop-blur hover:bg-muted transition-colors"
                aria-label="Previous brands"
                type="button"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToNext}
                className="rounded-full border border-border bg-background/80 p-2 backdrop-blur hover:bg-muted transition-colors"
                aria-label="Next brands"
                type="button"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Right column: hero image spans both left rows */}
        <div className="relative overflow-hidden bg-muted lg:row-span-2">
          <div className="relative h-64 w-full sm:h-80 lg:h-[360px]">
            {heroSlides.length > 0 ? (
              heroSlides.map((slide, idx) => (
                <div
                  key={`${slide.heroImageUrl}-${idx}`}
                  className={
                    'absolute inset-0 transition-opacity duration-700 ease-in-out ' +
                    (idx === safeActiveIndex ? 'opacity-100' : 'opacity-0')
                  }
                >
                  <Image
                    src={slide.heroImageUrl}
                    alt={slide.sportName}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    priority={idx === safeActiveIndex}
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              ))
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No hero images configured.
              </div>
            )}
          </div>
        </div>

        {/* Left column: Row 2 (3x3 brands + 4th row button) */}
        <div>
          <div className="grid grid-cols-3 gap-4">
            {visibleBrands.map((brand) => (
              <div
                key={brand._id}
                className="flex h-16 items-center justify-center rounded-sm border border-border bg-background px-4"
                title={brand.name}
              >
                {brand.logoUrl ? (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={120}
                    height={44}
                    className="max-h-10 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs font-medium text-foreground">{brand.name}</span>
                )}
              </div>
            ))}

            {publishedBrands.length === 0 && (
              <div className="col-span-full rounded-sm border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No published brands yet.
              </div>
            )}

            {publishedBrands.length > 0 && (
              <div className="col-span-3 flex justify-center pt-2">
                <Link
                  href="/brands"
                  className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
                >
                  View All Brands
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
