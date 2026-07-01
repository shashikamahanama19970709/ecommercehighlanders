'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { useCurrency } from '@/lib/currency-context';
import type { ShopBySportEntry, ShopBySportModule } from '@/types/shop-by-sport';
import type { Product, Sport } from '@/types/product';

function getName(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Avoid rendering raw Mongo ObjectIds in the UI.
    if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return '';
    return trimmed;
  }
  const maybe = value as { name?: string };
  return maybe.name ?? '';
}

function getSportId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const maybe = value as { _id?: unknown };
  return typeof maybe._id === 'string' ? maybe._id : '';
}

function extractProducts(entry: ShopBySportEntry): Product[] {
  if (Array.isArray(entry.products) && entry.products.length > 0) return entry.products;
  const populated = Array.isArray(entry.productIds) ? entry.productIds : [];
  return populated.filter((p): p is Product => typeof p !== 'string' && !!p);
}

function getProductImage(p: Product): string | undefined {
  return p.featureImageUrl || (Array.isArray(p.imageUrls) ? p.imageUrls[0] : undefined) || p.images?.[0];
}

type Props = {
  moduleDoc: ShopBySportModule | null;
  sports?: Sport[];
};

export function ShopBySportLandingSection({ moduleDoc, sports }: Props) {
  const { formatPrice, selectedCurrency } = useCurrency();

  const fallbackEntries = useMemo(() => {
    return (sports || []).map((sport) => ({
      sport,
      heroImageKey: sport.imageKey,
      heroImageUrl: sport.imageKey ? `/api/upload?key=${encodeURIComponent(sport.imageKey)}` : undefined,
      productIds: [],
      products: [],
    })) as unknown as ShopBySportEntry[];
  }, [sports]);

  const entries = useMemo(() => {
    const raw = Array.isArray(moduleDoc?.entries) ? moduleDoc!.entries : [];
    const filtered = raw.filter((entry) => {
      const name = getName(entry?.sport);
      return typeof name === 'string' && name.trim() !== '';
    });

    if (filtered.length === 0) {
      return fallbackEntries;
    }
    return filtered;
  }, [moduleDoc, fallbackEntries]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [heroImageError, setHeroImageError] = useState(false);

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(entries.length - 1, 0));
  const selectedEntry = entries[safeSelectedIndex];

  // Reset image error state when selection changes
  useEffect(() => {
    setHeroImageError(false);
  }, [selectedEntry]);

  const sportImageUrl = useMemo(() => {
    if (!selectedEntry?.sport || typeof selectedEntry.sport === 'string') return undefined;
    return (selectedEntry.sport as any).imageUrl;
  }, [selectedEntry]);

  const activeHeroUrl = useMemo(() => {
    return selectedEntry?.heroImageUrl || sportImageUrl;
  }, [selectedEntry, sportImageUrl]);

  const selectedSportName = selectedEntry ? getName(selectedEntry.sport) || 'Sport' : '';
  const selectedSportId = selectedEntry ? getSportId(selectedEntry.sport) : '';
  const selectedProducts = selectedEntry ? extractProducts(selectedEntry).slice(0, 4) : [];

  if (moduleDoc?.isActive === false) return null;
  if (entries.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Shop by sport</h2>
          <p className="text-xs text-muted-foreground">Selections are managed in admin.</p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left selector */}
        <div className="h-fit self-start rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const name = getName(entry.sport) || `Sport ${idx + 1}`;
              const isActive = idx === safeSelectedIndex;

              return (
                <button
                  key={`${name}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={
                    `cursor-pointer flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm transition-all duration-300 border-l-4 ` +
                    (isActive
                      ? 'bg-[#0f1a2e] text-[#c8a84b] border-[#c8a84b] shadow-md'
                      : 'bg-white text-slate-700 border-transparent hover:bg-[#0f1a2e]/5 hover:border-[#0f1a2e]/20 hover:shadow-sm')
                  }
                >
                  <span className={`truncate font-semibold ${isActive ? 'text-[#c8a84b]' : 'text-slate-700'}`}
                    >
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right hero */}
        <div className="relative z-0 overflow-hidden rounded-none border-0 bg-muted shadow-lg">
          <div className="relative h-80 w-full sm:h-[440px] lg:h-[520px]">
            {activeHeroUrl && !heroImageError ? (
              <Image
                src={activeHeroUrl}
                alt={selectedSportName}
                fill
                className="object-cover"
                onError={() => setHeroImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0f1a2e] to-[#1b2b45] p-10 relative overflow-hidden">
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#c8a84b]/10 blur-3xl pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#1e3a5f]/50 blur-3xl pointer-events-none" />
                <div className="opacity-15 mb-4 transform scale-125">
                  <svg viewBox="0 0 80 80" className="h-20 w-20 fill-white">
                    <polygon points="6,62 26,18 46,62" />
                    <polygon points="24,62 44,8 64,62" opacity="0.85" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c8a84b]/80 mb-1">Highlanders Sports</span>
                <h3 className="text-xl font-black text-white tracking-wider uppercase">{selectedSportName}</h3>
              </div>
            )}
            <div className="absolute inset-0 bg-black/25" />

            <div className="absolute top-0 right-0 flex flex-col items-end gap-2 p-6 sm:p-8">
              <h3 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl mb-2 text-right">{selectedSportName}</h3>
              <Link
                href={selectedSportId ? `/shop-by-sport?sportId=${encodeURIComponent(selectedSportId)}` : '/shop-by-sport'}
                className="cursor-pointer inline-flex items-center justify-center rounded-full bg-background/95 px-5 py-2 text-xs font-medium text-foreground hover:bg-background shadow-md"
              >
                Shop now
              </Link>
            </div>
          </div>
        </div>

        {/* Products: left-aligned under side menu (lg), overlap hero bottom */}
        <div className="relative z-10 mt-6 px-6 pb-6 sm:mt-[-72px] lg:col-span-2 lg:mt-[-240px] lg:px-0 lg:pb-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {selectedProducts.map((p) => {
              const img = getProductImage(p);
              const brandLabel = getName(p.brand) || 'Brand';
              const equipmentLabel = getName(p.equipment);
              const modelsValue = (p as unknown as { models?: unknown }).models;
              const specModel = (() => {
                const specs = (p as any)?.specifications;
                if (!specs || typeof specs !== 'object') return undefined;
                for (const [key, value] of Object.entries(specs as Record<string, unknown>)) {
                  if (!key || typeof key !== 'string') continue;
                  if (!key.toLowerCase().includes('model')) continue;
                  if (typeof value === 'string' && value.trim() !== '') return value.trim();
                  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
                  if (Array.isArray(value)) {
                    for (const item of value) {
                      if (typeof item === 'string' && item.trim() !== '') return item.trim();
                      if (typeof item === 'number' && Number.isFinite(item)) return String(item);
                      if (item && typeof item === 'object') {
                        const maybeObj = item as { name?: unknown; model?: unknown; value?: unknown };
                        if (typeof maybeObj.model === 'string' && maybeObj.model.trim() !== '') return maybeObj.model.trim();
                        if (typeof maybeObj.name === 'string' && maybeObj.name.trim() !== '') return maybeObj.name.trim();
                        if (typeof maybeObj.value === 'string' && maybeObj.value.trim() !== '') return maybeObj.value.trim();
                      }
                    }
                  }
                }
                return undefined;
              })();

              const legacyModelFromModelsValue = (() => {
                if (!modelsValue) return undefined;
                if (typeof modelsValue === 'string' && modelsValue.trim() !== '') return modelsValue.trim();
                if (!Array.isArray(modelsValue)) return undefined;

                for (const item of modelsValue) {
                  if (typeof item === 'string' && item.trim() !== '') return item.trim();
                  if (item && typeof item === 'object') {
                    const maybeObj = item as { name?: unknown; model?: unknown; value?: unknown };
                    if (typeof maybeObj.model === 'string' && maybeObj.model.trim() !== '') return maybeObj.model.trim();
                    if (typeof maybeObj.name === 'string' && maybeObj.name.trim() !== '') return maybeObj.name.trim();
                    if (typeof maybeObj.value === 'string' && maybeObj.value.trim() !== '') return maybeObj.value.trim();
                  }
                }

                return undefined;
              })();
              const modelLabel =
                legacyModelFromModelsValue ||
                (typeof p.model === 'string' && p.model.trim() !== '' ? p.model.trim() : undefined) ||
                specModel ||
                (typeof p.name === 'string' && p.name.trim() !== '' ? p.name.trim() : '') ||
                equipmentLabel ||
                '—';

              const imageAlt = modelLabel || brandLabel;
              const price = typeof p.price === 'number' ? p.price : undefined;
              const stock = typeof p.stock === 'number' ? p.stock : 0;

              return (
                <article
                  key={p._id}
                  className="group overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-40 w-full bg-slate-50 overflow-hidden sm:h-44">
                    {img ? (
                      <Image
                        src={img}
                        alt={imageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="space-y-2 p-5">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-base font-semibold text-foreground">{brandLabel}</p>
                      <AddToCartButton product={p} size={16} />
                    </div>
                    <p className="truncate text-[12px] font-medium text-foreground/70">{modelLabel}</p>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="text-sm font-semibold text-foreground">
                        {price !== undefined ? formatPrice(price) : '—'}
                        <span className="ml-1 text-[10px] text-muted-foreground">{selectedCurrency.code}</span>
                      </div>
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[10px] font-medium ' +
                          (stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                        }
                      >
                        {stock > 0 ? 'In stock' : 'Out of stock'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Stock: {stock}</p>

                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
