import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { PopularCategories } from "@/components/popular-categories";
import { ShopBySportLandingSection } from "@/components/shop-by-sport-landing";
import { BrandsLandingSection } from "@/components/brands-landing";
import { LandingVideoHero } from "@/components/landing-video-hero";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { HeaderNav } from "@/components/header-nav";
import type { Brand, Product, Sport } from "@/types/product";
import type { ShopBySportModule } from "@/types/shop-by-sport";

type Category = string;

const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Cricket", label: "Cricket" },
  { id: "Football", label: "Football" },
  { id: "Gym", label: "Gym" },
  { id: "Running", label: "Running" },
  { id: "Others", label: "Others" },
];

async function fetchProducts(category?: Category | "all") {
  const params = category && category !== "all" ? `?sport=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/products${params}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return [] as Product[];
  return (await res.json()) as Product[];
}

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

export default async function Home() {
  const products = await fetchProducts("all");
  const sports = await fetchSports();
  const brands = await fetchBrands();
  const shopBySportModule = await fetchShopBySportModule();

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

        <section id="catalog" className="bg-background py-16 scroll-mt-24">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Shop by category</h2>
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium">{products.length}</span> active products
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs hover:bg-foreground hover:text-background"
                  type="button"
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed bg-muted p-8 text-center text-sm text-muted-foreground">
                  No products yet. Sign in to the admin dashboard to add your first sports item.
                </div>
              )}

              {products.map((product) => (
                <article
                  key={product._id}
                  className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-40 w-full bg-muted">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={
                          (typeof product.equipment === "string" ? undefined : product.equipment?.name) ??
                          product._id ??
                          "Product"
                        }
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        {(typeof product.sport === "string" ? undefined : product.sport?.name) ?? "Unknown Sport"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          (product.stock || 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {(product.stock || 0) > 0 ? "In stock" : "Out of stock"}
                      </span>
                    </div>
                    <h3 className="truncate text-sm font-semibold">
                      {(typeof product.equipment === "string" ? undefined : product.equipment?.name) ??
                        "Unknown Equipment"}
                    </h3>
                    <p className="line-clamp-2 text-[11px] text-zinc-600">
                      {(typeof product.brand === "string" ? undefined : product.brand?.name) ?? "Unknown Brand"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        ${product.price?.toFixed(2) || "0.00"}
                        <span className="ml-1 text-[10px] text-zinc-500">USD</span>
                      </div>
                      <AddToCartButton product={product} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
