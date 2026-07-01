'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Brand } from '@/types/product';
import type { ShopBySportModule } from '@/types/shop-by-sport';

type Props = {
  brands: Brand[];
  shopBySportModule: ShopBySportModule | null;
};

export function BrandsLandingSection({ brands }: Props) {
  const publishedBrands = useMemo(() => {
    return (Array.isArray(brands) ? brands : []).filter((b) => b?.isPublished);
  }, [brands]);

  const marqueeBrands = useMemo(() => {
    const list = [...publishedBrands];
    if (list.length === 0) return [];
    
    // Multiply to fill screen width and loop nicely
    const repeated = [];
    while (repeated.length < 12) {
      repeated.push(...list);
    }
    return repeated;
  }, [publishedBrands]);

  if (publishedBrands.length === 0) return null;

  return (
    <section className="relative w-full">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          gap: 1.5rem;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0f1a2e] uppercase">Brands</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Explore our premium authorized stockists catalog</p>
        </div>
      </div>

      {/* Marquee Wrapper */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Left and right fade overlay for premium styling */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Sliding track */}
        <div className="flex w-max">
          {/* First loop */}
          <div className="animate-marquee pr-6">
            {marqueeBrands.map((brand, idx) => (
              <Link
                key={`brand-l1-${brand._id}-${idx}`}
                href={brand.associatedSports?.length > 0 
                  ? `/shop-by-sport?sportId=${brand.associatedSports[0]._id}&brandId=${brand._id}` 
                  : `/shop-by-sport?brandId=${brand._id}`
                }
                className="group flex w-44 h-20 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                title={`Shop ${brand.name}`}
              >
                {brand.logoUrl ? (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={140}
                    height={50}
                    className="max-h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-[#0f1a2e] flex items-center justify-center text-xs font-bold group-hover:bg-[#0f1a2e] group-hover:text-white transition-colors duration-300">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#c8a84b] transition-colors">{brand.name}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
          {/* Second loop to create infinite track */}
          <div className="animate-marquee pr-6" aria-hidden="true">
            {marqueeBrands.map((brand, idx) => (
              <Link
                key={`brand-l2-${brand._id}-${idx}`}
                href={brand.associatedSports?.length > 0 
                  ? `/shop-by-sport?sportId=${brand.associatedSports[0]._id}&brandId=${brand._id}` 
                  : `/shop-by-sport?brandId=${brand._id}`
                }
                className="group flex w-44 h-20 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                title={`Shop ${brand.name}`}
              >
                {brand.logoUrl ? (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={140}
                    height={50}
                    className="max-h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-[#0f1a2e] flex items-center justify-center text-xs font-bold group-hover:bg-[#0f1a2e] group-hover:text-white transition-colors duration-300">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#c8a84b] transition-colors">{brand.name}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Centered button */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/brands"
          className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[#0f1a2e] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#c8a84b] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
        >
          View All Brands
        </Link>
      </div>
    </section>
  );
}
