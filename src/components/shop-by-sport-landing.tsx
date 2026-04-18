'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { AddToCartButton } from '@/components/add-to-cart-button';
import type { ShopBySportEntry, ShopBySportModule } from '@/types/shop-by-sport';
import type { Product } from '@/types/product';

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
};

export function ShopBySportLandingSection({ moduleDoc }: Props) {
  const entries = useMemo(() => {
    return Array.isArray(moduleDoc?.entries) ? moduleDoc!.entries : [];
  }, [moduleDoc]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(entries.length - 1, 0));
  const selectedEntry = entries[safeSelectedIndex];

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
        <div className="h-fit self-start rounded-none bg-muted/40 p-4 shadow-sm">
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
                    `cursor-pointer flex w-full items-center gap-3 rounded-none px-4 py-3 text-left text-sm transition-colors transition-shadow ` +
                    (isActive
                      ? 'bg-blue-50 shadow-md dark:bg-blue-950/30'
                      : 'bg-transparent hover:bg-red-50 hover:shadow-sm dark:hover:bg-red-950/20')
                  }
                >
                  <span className={`truncate ${isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}
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
            {selectedEntry?.heroImageUrl ? (
              <Image src={selectedEntry.heroImageUrl} alt={selectedSportName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No hero image</div>
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
                  className="group overflow-hidden rounded-none bg-background shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-40 w-full bg-muted sm:h-44">
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
                        {price !== undefined ? `£${price.toFixed(2)}` : '—'}
                        <span className="ml-1 text-[10px] text-muted-foreground">GBP</span>
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
