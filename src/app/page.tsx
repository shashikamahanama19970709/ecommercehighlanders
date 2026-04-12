import Link from "next/link";
import Image from "next/image";
import { PopularCategories } from "@/components/popular-categories";
import type { Product, Sport } from "@/types/product";

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
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/products${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [] as Product[];
  }

  return (await res.json()) as Product[];
}

async function fetchSports() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/sports`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [] as Sport[];
  }

  return (await res.json()) as Sport[];
}

export default async function Home() {
  const products = await fetchProducts("all");
  const sports = await fetchSports();

  return (
    <div className="flex-1">
      <header className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="cursor-pointer flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
              <span className="text-sm font-semibold">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">Sportify Shop</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-foreground">
            <Link href="#catalog" className="cursor-pointer hover:text-primary">
              Shop
            </Link>
            <Link href="/admin" className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs hover:bg-foreground hover:text-background">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              New • Multi-sport ecommerce platform
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl text-foreground">
              Gear up for
              <span className="block text-primary">Cricket, Football, Gym & more.</span>
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Browse curated sports equipment across multiple categories with live inventory,
              multi-currency pricing, and secure Stripe checkout.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="#catalog"
                className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-background hover:bg-foreground/90"
              >
                Shop sports items
              </a>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex -space-x-1">
                  <span className="h-6 w-6 rounded-full bg-primary/20" />
                  <span className="h-6 w-6 rounded-full bg-green-200 dark:bg-green-800" />
                  <span className="h-6 w-6 rounded-full bg-orange-200 dark:bg-orange-800" />
                </div>
                Trusted by athletes and teams
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-blue-600 via-slate-900 to-emerald-500 p-6 text-white shadow-lg">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-100">Live categories</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-[10px] text-blue-100">Cricket kits</p>
                  <p className="mt-1 text-sm font-semibold">Bats, pads, gloves</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-[10px] text-blue-100">Football</p>
                  <p className="mt-1 text-sm font-semibold">Boots, balls, kits</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-[10px] text-blue-100">Gym</p>
                  <p className="mt-1 text-sm font-semibold">Weights & accessories</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-[10px] text-blue-100">Running</p>
                  <p className="mt-1 text-sm font-semibold">Shoes & wearables</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-foreground/30 p-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-background/80">Secure payments</p>
                <p className="text-sm font-semibold text-background">Stripe checkout enabled</p>
              </div>
              <Image src="/stripe.svg" alt="Stripe" width={60} height={24} className="opacity-80" />
            </div>
          </div>
        </section>

        {/* Popular Categories Section */}
        <PopularCategories sports={sports} />

        <section id="catalog" className="mt-16 space-y-6">
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
              <div className="col-span-full rounded-2xl border border-dashed bg-muted p-8 text-center text-sm text-muted-foreground">
                No products yet. Sign in to the admin dashboard to add your first sports item.
              </div>
            )}

            {products.map((product) => (
              <article
                key={product._id}
                className="flex flex-col overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-40 w-full bg-muted">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.equipment?.name || product._id || 'Product'}
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
                      {product.sport?.name || 'Unknown Sport'}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      (product.stock || 0) > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {(product.stock || 0) > 0 ? "In stock" : "Out of stock"}
                    </span>
                  </div>
                  <h3 className="truncate text-sm font-semibold">
                    {product.equipment?.name || 'Unknown Equipment'}
                  </h3>
                  <p className="line-clamp-2 text-[11px] text-zinc-600">
                    {product.brand?.name || 'Unknown Brand'}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      ${product.price?.toFixed(2) || '0.00'}
                      <span className="ml-1 text-[10px] text-zinc-500">USD</span>
                    </div>
                    <button
                      type="button"
                      disabled={(product.stock || 0) <= 0}
                      className="cursor-pointer inline-flex items-center rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
