import Image from 'next/image';
import ImageWithFallback from '@/components/image-with-fallback';
import Link from 'next/link';
import type { Brand } from '@/types/product';

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
    <div className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Brands</h1>
            <p className="mt-1 text-sm text-muted-foreground">Explore our published brands.</p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            Back to shop
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {publishedBrands.map((brand) => (
            <div
              key={brand._id}
              className="flex h-20 items-center justify-center rounded-sm border border-border bg-background px-4"
              title={brand.name}
            >
              {brand.logoUrl ? (
                <ImageWithFallback
                  src={brand.logoUrl}
                  alt={brand.name}
                  width={140}
                  height={52}
                  className="max-h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-foreground">{brand.name}</span>
              )}
            </div>
          ))}

          {publishedBrands.length === 0 && (
            <div className="col-span-full rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No published brands yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
