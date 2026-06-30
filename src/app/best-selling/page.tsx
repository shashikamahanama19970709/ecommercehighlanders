"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { HeaderNav } from "@/components/header-nav";
import { useCurrency } from "@/lib/currency-context";
import { useSession } from "next-auth/react";
import type { Brand, Product, Sport } from "@/types/product";
import { Sparkles, Search, ShoppingBag, X } from "lucide-react";

function getProductImage(p: Product): string | undefined {
  return p.featureImageUrl || (Array.isArray(p.imageUrls) ? p.imageUrls[0] : undefined) || p.images?.[0];
}

function getProductImages(p: Product): string[] {
  const urls: string[] = [];
  if (typeof p.featureImageUrl === "string" && p.featureImageUrl.trim()) urls.push(p.featureImageUrl.trim());
  if (Array.isArray(p.imageUrls)) {
    for (const u of p.imageUrls) {
      if (typeof u === "string" && u.trim()) urls.push(u.trim());
    }
  }
  if (Array.isArray(p.images)) {
    for (const u of p.images) {
      if (typeof u === "string" && u.trim()) urls.push(u.trim());
    }
  }
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const u of urls) {
    if (seen.has(u)) continue;
    seen.add(u);
    unique.push(u);
  }
  return unique;
}

function getName(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return "";
    return trimmed;
  }
  const maybe = value as { name?: string };
  return maybe.name ?? "";
}

function getSportId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in (value as any)) {
    const raw = (value as any)._id;
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && typeof (raw as any).toString === "function") return String(raw);
  }
  return "";
}

function formatSpecValue(value: unknown): string {
  const parts = toFilterStrings(value);
  if (parts.length === 0) return "";
  return parts.join(", ");
}

function toFilterStrings(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (typeof value === "number" && Number.isFinite(value)) return [String(value)];
  if (typeof value === "boolean") return [value ? "true" : "false"];
  if (Array.isArray(value)) return value.flatMap((v) => toFilterStrings(v));
  if (typeof value === "object") {
    const maybe = value as { name?: unknown; value?: unknown; label?: unknown; model?: unknown };
    return [
      ...toFilterStrings(maybe.name),
      ...toFilterStrings(maybe.value),
      ...toFilterStrings(maybe.label),
      ...toFilterStrings(maybe.model),
    ];
  }
  return [];
}

function BestSellingPageContent() {
  const { formatPrice, selectedCurrency } = useCurrency();
  const { data: session } = useSession();
  const [sports, setSports] = useState<Sport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeProductImageUrl, setActiveProductImageUrl] = useState<string>("");

  // Notify Me states
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [notifyError, setNotifyError] = useState<string | null>(null);

  // Pre-fill email and reset states on active product change
  useEffect(() => {
    if (activeProduct) {
      setNotifyEmail(session?.user?.email || '');
      setNotifyStatus('idle');
      setNotifyError(null);
    }
  }, [activeProduct, session]);

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !notifyEmail) return;
    setNotifyStatus('loading');
    setNotifyError(null);

    try {
      const res = await fetch('/api/products/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: String(activeProduct._id), email: notifyEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed.');
      }

      setNotifyStatus('success');
    } catch (err: any) {
      setNotifyStatus('error');
      setNotifyError(err.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const [sportsRes, productsRes] = await Promise.all([
          fetch('/api/sports', { cache: 'no-store' }),
          fetch("/api/products?sort=best-selling", { cache: "no-store" }),
        ]);

        if (!sportsRes.ok) throw new Error('Failed to fetch sports');
        if (!productsRes.ok) throw new Error('Failed to fetch products');

        const sportsData = (await sportsRes.json()) as Sport[];
        const productsData = (await productsRes.json()) as Product[];

        setSports(Array.isArray(sportsData) ? sportsData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (!activeProduct) {
      setActiveProductImageUrl("");
      return;
    }
    const images = getProductImages(activeProduct);
    setActiveProductImageUrl(images[0] ?? "");
  }, [activeProduct]);

  useEffect(() => {
    if (!activeProduct) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveProduct(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeProduct]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSport = selectedSportId === "all" || getSportId(p.sport) === selectedSportId;
      
      const equipmentName = getName(p.equipment).toLowerCase();
      const brandName = getName(p.brand).toLowerCase();
      const name = (p.name || "").toLowerCase();
      const search = searchQuery.toLowerCase();
      
      const matchesSearch =
        !searchQuery ||
        equipmentName.includes(search) ||
        brandName.includes(search) ||
        name.includes(search);

      return matchesSport && matchesSearch;
    });
  }, [products, selectedSportId, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 shadow-sm transition-shadow duration-300">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="h-10 w-10 shrink-0 bg-slate-200 animate-pulse rounded-full" />
              <div className="h-4 w-48 bg-slate-200 animate-pulse rounded" />
            </div>
          </div>
        </header>
        <div className="h-16" />
        <main className="flex-1 flex items-center justify-center p-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-[#c8a84b]" />
            <span className="text-sm font-medium text-slate-500">Loading Best Sellers…</span>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 shadow-sm transition-shadow duration-300">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-widest text-[#0f1a2e]">Highlanders</span>
              </Link>
              <HeaderNav />
            </div>
          </div>
        </header>
        <div className="h-16" />
        <main className="flex-1 flex items-center justify-center p-10">
          <div className="max-w-md text-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 shadow-sm">
            <p className="text-sm font-semibold text-destructive">Error loading best sellers</p>
            <p className="mt-2 text-xs text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-[#0f1a2e] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 shadow-sm transition-shadow duration-300 overflow-visible">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="cursor-pointer group flex items-center gap-2 shrink-0" aria-label="Highlanders Sports & Fitness Home">
              {/* SVG Logo Mark */}
              <div className="relative h-10 w-10 shrink-0">
                <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="bs-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/>
                      <stop offset="50%" stopColor="#c8d4e4"/>
                      <stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="bs-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/>
                      <stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="bs-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/>
                      <stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#bs-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#bs-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#bs-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#bs-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              {/* Brand text */}
              <div className="hidden sm:flex flex-col leading-tight text-left font-sans">
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

      {/* Hero Banner Section */}
      <section className="relative py-16 overflow-hidden bg-[#0f1a2e] text-white">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#c8a84b]/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-[#1e3a5f]/40 blur-3xl pointer-events-none" />

        <div className="mx-auto w-full max-w-5xl px-6 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#c8a84b]/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#c8a84b] mb-4">
            <Sparkles className="h-3.5 w-3.5 text-[#c8a84b]" />
            <span>Store Favorites</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white">
            Best Selling Items
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-medium">
            Explore the most popular gear and equipment chosen by athletes and fitness lovers.
          </p>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <main className="flex-1 pb-20 pt-10">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-8 items-start lg:grid-cols-[240px_1fr]">
            
            {/* Sidebar Controls */}
            <aside className="space-y-6 rounded-2xl border bg-background p-5 shadow-sm">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Search catalog
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search best sellers..."
                    className="w-full rounded-xl border bg-background pl-9 pr-4 py-2 text-xs outline-none focus:border-[#1e3a5f] transition-all"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Filter by Sport
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setSelectedSportId("all")}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                      selectedSportId === "all"
                        ? "bg-[#0f1a2e] text-white shadow-sm"
                        : "text-[#0f1a2e]/85 hover:bg-slate-100"
                    }`}
                  >
                    <span>All Sports</span>
                    <ShoppingBag className="h-3.5 w-3.5 opacity-60" />
                  </button>
                  {sports.map((sport) => {
                    const id = sport._id ?? "";
                    if (!id) return null;
                    const isActive = id === selectedSportId;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedSportId(id)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-[#0f1a2e] text-white shadow-sm"
                            : "text-[#0f1a2e]/85 hover:bg-slate-100"
                        }`}
                      >
                        <span className="truncate">{sport.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Product Display Area */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"} Found
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
                  <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-sm font-semibold text-[#0f1a2e]">No best sellers found</p>
                  <p className="mt-1 text-xs text-slate-400">Try adjusting your search filters or check back later.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((p) => {
                    const img = getProductImage(p);
                    const brandLabel = getName(p.brand) || "Brand";
                    const equipmentLabel = getName(p.equipment);
                    const modelsValue = (p as any).models;
                    const specModel = (() => {
                      const specs = p.specifications;
                      if (!specs || typeof specs !== "object") return undefined;
                      for (const [key, value] of Object.entries(specs)) {
                        if (!key.toLowerCase().includes("model")) continue;
                        if (typeof value === "string" && value.trim() !== "") return value.trim();
                        if (typeof value === "number" && Number.isFinite(value)) return String(value);
                      }
                      return undefined;
                    })();

                    const legacyModelFromModelsValue = (() => {
                      if (!modelsValue) return undefined;
                      if (typeof modelsValue === "string" && modelsValue.trim() !== "") return modelsValue.trim();
                      if (!Array.isArray(modelsValue)) return undefined;
                      for (const item of modelsValue) {
                        if (typeof item === "string" && item.trim() !== "") return item.trim();
                      }
                      return undefined;
                    })();

                    const modelLabel =
                      legacyModelFromModelsValue ||
                      (typeof (p as any).model === "string" && (p as any).model.trim() !== "" ? (p as any).model.trim() : undefined) ||
                      specModel ||
                      (typeof p.name === "string" && p.name.trim() !== "" ? p.name.trim() : "") ||
                      equipmentLabel ||
                      "";

                    const imageAlt = modelLabel || brandLabel;
                    const price = typeof p.price === "number" ? p.price : 0;
                    const stock = typeof p.stock === "number" ? p.stock : 0;

                    return (
                      <article
                        key={p._id}
                        onClick={() => setActiveProduct(p)}
                        className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                      >
                        <div className="relative h-44 w-full bg-slate-50">
                          {img ? (
                            <Image
                              src={img}
                              alt={imageAlt}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-102"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image</div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 p-5 space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <h3 className="truncate text-base font-bold text-[#0f1a2e]">{brandLabel}</h3>
                            <div onClick={(e) => e.stopPropagation()}>
                              <AddToCartButton product={p} size={16} />
                            </div>
                          </div>
                          <p className="truncate text-xs font-semibold text-slate-500">{modelLabel}</p>
                          <div className="flex items-center justify-between gap-3 pt-2 mt-auto">
                            <span className="text-sm font-black text-[#0f1a2e]">
                              {formatPrice(price)}
                              <span className="ml-1 text-[10px] text-slate-400 font-semibold">{selectedCurrency.code}</span>
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                stock > 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                              }`}
                            >
                              {stock > 0 ? "In Stock" : "Out of stock"}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Detail Modal overlay */}
      {activeProduct && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border bg-background shadow-2xl p-6 sm:p-8 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f1a2e]">
                  {getName(activeProduct.equipment) || activeProduct.name || "Product Details"}
                </h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  Brand: <span className="text-[#0f1a2e] font-semibold">{getName(activeProduct.brand)}</span>
                  {activeProduct.sku ? ` • SKU: ${activeProduct.sku}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Image Gallery */}
              <div className="space-y-4">
                <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl bg-slate-50 border">
                  {activeProductImageUrl ? (
                    <Image
                      src={activeProductImageUrl}
                      alt={activeProduct.name || "Product image"}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No product image</div>
                  )}
                </div>

                {/* Sub Thumbnails */}
                {getProductImages(activeProduct).length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {getProductImages(activeProduct).map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        onClick={() => setActiveProductImageUrl(img)}
                        className={`relative h-14 w-14 overflow-hidden rounded-lg border transition-all ${
                          activeProductImageUrl === img ? "border-[#c8a84b] ring-2 ring-[#c8a84b]/10" : "hover:border-[#0f1a2e]/30"
                        }`}
                      >
                        <Image src={img} alt="thumbnail" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Pricing & Specs */}
              <div className="space-y-6 text-left">
                <div className="rounded-2xl bg-slate-50 p-5 space-y-4 border border-slate-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#0f1a2e]">
                      {formatPrice(Number(activeProduct.price ?? 0))}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{selectedCurrency.code}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span>Stock: <span className="text-[#0f1a2e] font-bold">{activeProduct.stock ?? 0} units</span></span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        (activeProduct.stock ?? 0) > 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      {(activeProduct.stock ?? 0) > 0 ? "In Stock" : "Out of stock"}
                    </span>
                  </div>

                  {Number(activeProduct.stock ?? 0) > 0 ? (
                    <div className="pt-2 flex items-center gap-2">
                      <AddToCartButton product={activeProduct} size={18} />
                      <span className="text-xs font-bold text-[#0f1a2e]">Add to Shopping Cart</span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200/80 mt-2 space-y-2">
                      {notifyStatus === "success" ? (
                        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700 font-medium">
                          ✓ You&apos;re on the list! We will email you the moment this gear is back in stock.
                        </div>
                      ) : (
                        <form onSubmit={handleNotifyMe} className="space-y-2 text-left">
                          <p className="text-[11px] font-medium text-slate-500 leading-normal">
                            Get notified the second this item is restocked.
                          </p>
                          {notifyStatus === "error" && (
                            <p className="text-[11px] font-bold text-red-500">{notifyError}</p>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="email"
                              required
                              placeholder="your@email.com"
                              value={notifyEmail}
                              onChange={(e) => setNotifyEmail(e.target.value)}
                              disabled={notifyStatus === "loading"}
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0f1a2e] placeholder:text-slate-400 outline-none focus:border-[#0f1a2e]"
                            />
                            <button
                              type="submit"
                              disabled={notifyStatus === "loading"}
                              className="rounded-xl bg-[#0f1a2e] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                              {notifyStatus === "loading" ? "Saving..." : "Notify Me"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {activeProduct.description && activeProduct.description.trim() && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                      {activeProduct.description.trim()}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Product Specifications</h4>
                  {activeProduct.specifications && Object.keys(activeProduct.specifications).length > 0 ? (
                    <dl className="mt-2 grid gap-2 rounded-2xl border bg-slate-50/50 p-4 border-slate-100">
                      {Object.entries(activeProduct.specifications)
                        .filter(([k]) => String(k).trim() !== "")
                        .map(([k, v]) => {
                          const label = String(k).trim();
                          const value = formatSpecValue(v);
                          if (!value) return null;
                          return (
                            <div key={label} className="flex items-start justify-between gap-4 py-1 border-b border-slate-100 last:border-0">
                              <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                              <dd className="text-xs font-bold text-[#0f1a2e] text-right">{value}</dd>
                            </div>
                          );
                        })}
                    </dl>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400 font-medium">No specifications available for this item.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BestSellingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border bg-muted p-10 text-center text-sm text-muted-foreground animate-pulse">Loading Best Sellers…</div>
        </div>
      }
    >
      <BestSellingPageContent />
    </Suspense>
  );
}
