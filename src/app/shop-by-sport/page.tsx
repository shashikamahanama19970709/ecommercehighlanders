"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Image from "next/image";
import ImageWithFallback from "@/components/image-with-fallback";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { HeaderNav } from "@/components/header-nav";
import { useCurrency } from "@/lib/currency-context";
import { useSession } from "next-auth/react";
import { LogoLoader } from "@/components/logo-loader";
import type { ShopBySportModule } from "@/types/shop-by-sport";
import type { Brand, Product, Sport } from "@/types/product";

function getSportId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in (value as any)) {
    const raw = (value as any)._id;
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && typeof (raw as any).toString === "function") return String(raw);
  }
  if (typeof (value as any)?.toString === "function") return String(value as any);
  return "";
}

function getName(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Avoid rendering raw Mongo ObjectIds in the UI.
    if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return "";
    return trimmed;
  }
  const maybe = value as { name?: string };
  return maybe.name ?? "";
}

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

function getSpecificationValues(product: Product, key: string): string[] {
  if (!key) return [];
  const specs = (product as any)?.specifications;
  if (!specs || typeof specs !== "object") return [];
  if (!(key in (specs as Record<string, unknown>))) return [];
  return toFilterStrings((specs as Record<string, unknown>)[key]);
}

function ShopBySportPageContent() {
  const { formatPrice, convertPrice, selectedCurrency } = useCurrency();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const requestedSportId = searchParams.get('sportId') ?? '';

  const hasAppliedInitialSelection = useRef(false);
  const lastRequestedSportId = useRef<string>('');

  const [sports, setSports] = useState<Sport[]>([]);
  const [moduleDoc, setModuleDoc] = useState<ShopBySportModule | null>(null);

  const [selectedSportId, setSelectedSportId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("");
  const [brandFilterId, setBrandFilterId] = useState<string>("");
  const [specKeyFilter, setSpecKeyFilter] = useState<string>("");
  const [specValueFilter, setSpecValueFilter] = useState<string>("");

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeProductImageUrl, setActiveProductImageUrl] = useState<string>("");
  const [specFilters, setSpecFilters] = useState<Record<string, string>>({});
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const [sportsRes, moduleRes] = await Promise.all([
          fetch('/api/sports', { cache: 'no-store' }),
          fetch("/api/shop-by-sport", { cache: "no-store" }),
        ]);

        if (!sportsRes.ok) throw new Error('Failed to fetch sports');
        const sportsData = (await sportsRes.json()) as Sport[];
        setSports(Array.isArray(sportsData) ? sportsData : []);

        // Shop-by-sport module is optional here (used for hero images if configured)
        if (moduleRes.ok) {
          const data = (await moduleRes.json()) as ShopBySportModule;
          setModuleDoc(data);
        } else {
          setModuleDoc(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (lastRequestedSportId.current !== requestedSportId) {
      hasAppliedInitialSelection.current = false;
      lastRequestedSportId.current = requestedSportId;
    }
  }, [requestedSportId]);

  const sportsById = useMemo(() => {
    const map = new Map<string, Sport>();
    for (const s of sports) {
      if (s?._id) map.set(s._id, s);
    }
    return map;
  }, [sports]);

  useEffect(() => {
    if (hasAppliedInitialSelection.current) return;
    if (sports.length === 0) return;

    const requestedIsValid = requestedSportId && sportsById.has(requestedSportId);
    const next = requestedIsValid
      ? requestedSportId
      : selectedSportId && sportsById.has(selectedSportId)
        ? selectedSportId
        : sports[0]?._id ?? '';

    if (next && next !== selectedSportId) {
      setSelectedSportId(next);
    }

    if (next) {
      hasAppliedInitialSelection.current = true;
    }
  }, [requestedSportId, selectedSportId, sports, sportsById]);

  useEffect(() => {
    if (!selectedSportId) return;

    const controller = new AbortController();

    const run = async () => {
      setIsProductsLoading(true);
      setProductsError(null);
      try {
        const res = await fetch(`/api/products?sport=${encodeURIComponent(selectedSportId)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = (await res.json()) as Product[];
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setProducts([]);
        setProductsError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        if (!controller.signal.aborted) setIsProductsLoading(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [selectedSportId]);

  useEffect(() => {
    if (!selectedSportId) {
      setBrands([]);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      try {
        const res = await fetch(`/api/brands?sportId=${encodeURIComponent(selectedSportId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch brands");
        const data = (await res.json()) as Brand[];
        setBrands(Array.isArray(data) ? data : []);
      } catch {
        if (controller.signal.aborted) return;
        setBrands([]);
      }
    };

    void run();
    return () => controller.abort();
  }, [selectedSportId]);

  useEffect(() => {
    setEquipmentTypeFilter("");
    setBrandFilterId("");
    setSpecKeyFilter("");
    setSpecValueFilter("");
  }, [selectedSportId]);

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

  const selectedSportName = sportsById.get(selectedSportId)?.name ?? 'Sport';

  const isLockedToRequestedSport = Boolean(
    requestedSportId &&
      requestedSportId === selectedSportId &&
      sportsById.has(requestedSportId)
  );

  const heroImageUrl = useMemo(() => {
    const entries = Array.isArray(moduleDoc?.entries) ? moduleDoc!.entries : [];
    const entry = entries.find((e) => getSportId(e?.sport) === selectedSportId);
    return typeof entry?.heroImageUrl === 'string' && entry.heroImageUrl.trim() ? entry.heroImageUrl : undefined;
  }, [moduleDoc, selectedSportId]);

  const fallbackHeroUrl = useMemo(() => {
    const first = products[0];
    return first ? getProductImage(first) : undefined;
  }, [products]);

  const equipmentTypeOptions = useMemo(() => {
    const sport = sportsById.get(selectedSportId);
    const types = Array.isArray(sport?.equipmentTypes) ? sport!.equipmentTypes : [];
    return [...new Set(types.map((t) => String(t).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [selectedSportId, sportsById]);

  const brandOptions = useMemo(() => {
    const cleaned = brands
      .map((b) => ({
        id: b?._id ?? "",
        name: typeof b?.name === "string" ? b.name : "",
      }))
      .filter((b) => b.id && b.name);
    const unique = new Map<string, { id: string; name: string }>();
    for (const b of cleaned) unique.set(b.id, b);
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [brands]);

  const specificationKeys = useMemo(() => {
    if (!equipmentTypeFilter) return [];
    const keys = new Set<string>();
    const needle = equipmentTypeFilter.trim().toLowerCase();
    for (const p of products) {
      if (getName(p.equipment).trim().toLowerCase() !== needle) continue;
      const specs = (p as any)?.specifications;
      if (!specs || typeof specs !== "object") continue;
      for (const k of Object.keys(specs as Record<string, unknown>)) {
        const trimmed = String(k).trim();
        if (trimmed) keys.add(trimmed);
      }
    }
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [products, equipmentTypeFilter]);

  const specificationValueOptions = useMemo(() => {
    if (!equipmentTypeFilter || !specKeyFilter) return [] as string[];
    const values = new Set<string>();
    const needle = equipmentTypeFilter.trim().toLowerCase();
    for (const p of products) {
      if (getName(p.equipment).trim().toLowerCase() !== needle) continue;
      for (const v of getSpecificationValues(p, specKeyFilter)) {
        const trimmed = String(v).trim();
        if (trimmed) values.add(trimmed);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [products, specKeyFilter, equipmentTypeFilter]);

  useEffect(() => {
    setSpecValueFilter("");
  }, [specKeyFilter]);

  useEffect(() => {
    if (equipmentTypeFilter) return;
    setSpecKeyFilter("");
    setSpecValueFilter("");
  }, [equipmentTypeFilter]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (equipmentTypeFilter) {
      const needle = equipmentTypeFilter.trim().toLowerCase();
      list = list.filter((p) => getName(p.equipment).trim().toLowerCase() === needle);
    }

    if (brandFilterId) {
      list = list.filter((p) => getSportId(p.brand) === brandFilterId);
    }

    // Filter by all specification keys as separate fields
    if (Array.isArray(specificationKeys) && specificationKeys.length > 0) {
      for (const key of specificationKeys) {
        const filterValue = specFilters[key] || "";
        if (filterValue) {
          list = list.filter((p) => getSpecificationValues(p, key).some((v) => String(v).trim().toLowerCase() === filterValue.trim().toLowerCase()));
        }
      }
    }

    // Price range filter
    if (priceMin) {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) list = list.filter((p) => convertPrice(Number(p.price)) >= min);
    }
    if (priceMax) {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) list = list.filter((p) => convertPrice(Number(p.price)) <= max);
    }

    return list;
  }, [products, equipmentTypeFilter, brandFilterId, specificationKeys, specFilters, priceMin, priceMax, convertPrice]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 flex justify-center items-center">
        <LogoLoader size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-10 text-center text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (sports.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-dashed bg-muted p-10 text-center text-sm text-muted-foreground">No sports found.</div>
      </div>
    );
  }

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
                    <linearGradient id="sbs-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/>
                      <stop offset="50%" stopColor="#c8d4e4"/>
                      <stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="sbs-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/>
                      <stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="sbs-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/>
                      <stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  {/* Left mountain */}
                  <polygon points="6,62 26,18 46,62" fill="url(#sbs-hdr-silver)"/>
                  {/* Right mountain (taller) */}
                  <polygon points="24,62 44,8 64,62" fill="url(#sbs-hdr-silver)" opacity="0.85"/>
                  {/* Snow cap */}
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  {/* Gold wave */}
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#sbs-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  {/* Navy wave */}
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#sbs-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
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

      <div className="h-16" aria-hidden="true" />

      <main className="pb-16 pt-0">
        <section className="bg-background py-10">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {isLockedToRequestedSport ? selectedSportName : "Shop by sport"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLockedToRequestedSport
                  ? "Filtered products for this sport."
                  : "Pick a sport to see products."}
              </p>
            </div>

            {!isLockedToRequestedSport && (
              <div className="flex flex-wrap gap-2">
                {sports.map((sport) => {
                  const id = sport._id ?? '';
                  if (!id) return null;
                  const sportName = sport.name;
                  const isActive = id === selectedSportId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedSportId(id)}
                      className={`rounded-full border border-border px-3 py-1 text-xs hover:bg-accent ${isActive ? "bg-accent" : "bg-background"}`}
                    >
                      {sportName}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 space-y-4">
              {!isLockedToRequestedSport && (
                <div className="relative overflow-hidden rounded-3xl border bg-muted">
                  <div className="relative h-56 w-full">
                    {heroImageUrl ? (
                      <Image src={heroImageUrl} alt={selectedSportName} fill className="object-cover" />
                    ) : fallbackHeroUrl ? (
                      <Image src={fallbackHeroUrl} alt={selectedSportName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No hero image</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/80">Shop</p>
                      <h2 className="text-2xl font-semibold text-white">{selectedSportName}</h2>
                    </div>
                  </div>
                </div>
              )}

              {isLockedToRequestedSport && (
                <div className="rounded-2xl border bg-background p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Filters</p>
                      <h2 className="mt-1 text-sm font-semibold text-foreground">Narrow down by equipment, brand, and specs</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEquipmentTypeFilter("");
                        setBrandFilterId("");
                        setSpecKeyFilter("");
                        setSpecValueFilter("");
                      }}
                      className="self-start rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                    >
                      Clear filters
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Brand</label>
                      <select
                        value={brandFilterId}
                        onChange={(e) => setBrandFilterId(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All</option>
                        {brandOptions.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Equipment type</label>
                      <select
                        value={equipmentTypeFilter}
                        onChange={(e) => setEquipmentTypeFilter(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All</option>
                        {equipmentTypeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Render all specification keys as separate fields */}
                    {specificationKeys.map((k) => (
                      <div className="space-y-1" key={k}>
                        <label className="text-[11px] font-medium text-muted-foreground">{k}</label>
                        <select
                          value={specFilters[k] || ""}
                          onChange={(e) => setSpecFilters((prev) => ({ ...prev, [k]: e.target.value }))}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Any</option>
                          {[...new Set(products.flatMap((p) => getSpecificationValues(p, k)))]
                            .filter(Boolean)
                            .sort((a, b) => String(a).localeCompare(String(b)))
                            .map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                      </div>
                    ))}

                    {/* Price range filter with slider */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Price Range ({selectedCurrency.symbol})</label>
                      <div className="flex flex-col gap-2">
                        <Slider
                          range
                          min={0}
                          max={Math.max(1000, ...products.map(p => convertPrice(Number(p.price) || 0)))}
                          value={[
                            priceMin ? Number(priceMin) : 0,
                            priceMax ? Number(priceMax) : Math.max(1000, ...products.map(p => convertPrice(Number(p.price) || 0)))
                          ]}
                          onChange={(value) => {
                            if (Array.isArray(value)) {
                              const [min, max] = value;
                              setPriceMin(String(min));
                              setPriceMax(String(max));
                            }
                          }}
                          allowCross={false}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{selectedCurrency.symbol}{priceMin ? Number(priceMin).toFixed(0) : 0}</span>
                          <span>{selectedCurrency.symbol}{priceMax ? Number(priceMax).toFixed(0) : Math.max(1000, ...products.map(p => convertPrice(Number(p.price) || 0))).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isProductsLoading ? (
                  <div className="col-span-full py-12 flex justify-center items-center">
                    <LogoLoader size="sm" />
                  </div>
                ) : productsError ? (
                  <div className="col-span-full rounded-2xl border border-destructive/30 bg-destructive/10 p-10 text-center text-sm text-destructive">{productsError}</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed bg-muted p-10 text-center text-sm text-muted-foreground">No products for this sport.</div>
                ) : (
                  (isLockedToRequestedSport ? filteredProducts : filteredProducts.slice(0, 8)).map((p) => {
                    const img = getProductImage(p);
                    const equipmentName = getName(p.equipment) || p.name || "Product";
                    const brandName = getName(p.brand) || "";
                    const stock = p.stock ?? 0;
                    const modelsValue = (p as unknown as { models?: unknown }).models;
                    const specModel = (() => {
                      const specs = (p as any)?.specifications;
                      if (!specs || typeof specs !== "object") return "";
                      for (const [key, value] of Object.entries(specs as Record<string, unknown>)) {
                        if (!key || typeof key !== "string") continue;
                        if (!key.toLowerCase().includes("model")) continue;
                        if (typeof value === "string" && value.trim() !== "") return value.trim();
                        if (typeof value === "number" && Number.isFinite(value)) return String(value);
                        if (Array.isArray(value)) {
                          for (const item of value) {
                            if (typeof item === "string" && item.trim() !== "") return item.trim();
                            if (typeof item === "number" && Number.isFinite(item)) return String(item);
                            if (item && typeof item === "object") {
                              const maybeObj = item as { name?: unknown; model?: unknown; value?: unknown };
                              if (typeof maybeObj.model === "string" && maybeObj.model.trim() !== "") return maybeObj.model.trim();
                              if (typeof maybeObj.name === "string" && maybeObj.name.trim() !== "") return maybeObj.name.trim();
                              if (typeof maybeObj.value === "string" && maybeObj.value.trim() !== "") return maybeObj.value.trim();
                            }
                          }
                        }
                      }
                      return "";
                    })();

                    const legacyModelFromModelsValue = (() => {
                      if (!modelsValue) return "";
                      if (typeof modelsValue === "string" && modelsValue.trim() !== "") return modelsValue.trim();
                      if (!Array.isArray(modelsValue)) return "";
                      for (const item of modelsValue) {
                        if (typeof item === "string" && item.trim() !== "") return item.trim();
                        if (item && typeof item === "object") {
                          const maybeObj = item as { name?: unknown; model?: unknown; value?: unknown };
                          if (typeof maybeObj.model === "string" && maybeObj.model.trim() !== "") return maybeObj.model.trim();
                          if (typeof maybeObj.name === "string" && maybeObj.name.trim() !== "") return maybeObj.name.trim();
                          if (typeof maybeObj.value === "string" && maybeObj.value.trim() !== "") return maybeObj.value.trim();
                        }
                      }
                      return "";
                    })();
                    const model =
                      legacyModelFromModelsValue ||
                      (typeof p.model === "string" && p.model.trim() !== "" ? p.model.trim() : "") ||
                      specModel ||
                      (typeof p.name === "string" && p.name.trim() !== "" ? p.name.trim() : "") ||
                      getName(p.equipment) ||
                      "";

                    return (
                      <article
                        key={p._id}
                        onClick={() => {
                          if (!isLockedToRequestedSport) return;
                          setActiveProduct(p);
                        }}
                        onKeyDown={(e) => {
                          if (!isLockedToRequestedSport) return;
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          setActiveProduct(p);
                        }}
                        role={isLockedToRequestedSport ? "button" : undefined}
                        tabIndex={isLockedToRequestedSport ? 0 : -1}
                        className={`text-left overflow-hidden rounded-2xl border bg-background shadow-sm transition-colors ${isLockedToRequestedSport ? "cursor-pointer hover:bg-accent/40" : "cursor-default"}`}
                      >
                        <div className="relative h-32 w-full bg-muted">
                          {img ? (
                            <ImageWithFallback src={img} alt={equipmentName} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">No image</div>
                          )}
                        </div>
                        <div className="space-y-1 p-4 text-xs">
                          <p className="truncate text-sm font-semibold text-foreground">{equipmentName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {brandName}
                            {model ? ` • ${model}` : ""}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-semibold text-foreground">{formatPrice(Number(p.price ?? 0))}</span>
                            <div className="flex items-center gap-2">
                              {isLockedToRequestedSport && (
                                <span
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <AddToCartButton product={p} size={16} />
                                </span>
                              )}
                              <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {stock > 0 ? "In stock" : "Out"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {isLockedToRequestedSport && activeProduct && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Product details"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {getName(activeProduct.equipment) || activeProduct.name || "Product"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {getName(activeProduct.brand) || ""}
                  {activeProduct.sku ? ` • SKU: ${activeProduct.sku}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="ml-4 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                onClick={() => setActiveProduct(null)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 overflow-auto p-4 sm:grid-cols-2 sm:p-6">
              <div className="space-y-3">
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted ${activeProductImageUrl ? "cursor-zoom-in" : ""}`}
                  role={activeProductImageUrl ? "button" : undefined}
                  tabIndex={activeProductImageUrl ? 0 : undefined}
                  aria-label={activeProductImageUrl ? "Open image preview" : undefined}
                  onClick={() => {
                    if (!activeProductImageUrl) return;
                    window.open(activeProductImageUrl, "_blank", "noopener,noreferrer");
                  }}
                  onKeyDown={(e) => {
                    if (!activeProductImageUrl) return;
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    window.open(activeProductImageUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  {activeProductImageUrl ? (
                    <ImageWithFallback
                      src={activeProductImageUrl}
                      alt={getName(activeProduct.equipment) || activeProduct.name || "Product"}
                      fill
                      className="object-cover animate-pan-diagonal"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
                  )}
                </div>

                {getProductImages(activeProduct).length > 1 && (
                  <div className="flex gap-2 overflow-auto pb-1">
                    {getProductImages(activeProduct).map((u) => {
                      const isActive = u === activeProductImageUrl;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setActiveProductImageUrl(u)}
                          className={`relative h-14 w-20 flex-none overflow-hidden rounded-lg border bg-muted ${isActive ? "ring-2 ring-foreground" : "hover:bg-accent"}`}
                        >
                          <ImageWithFallback src={u} alt="" fill className="object-cover" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Price</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{formatPrice(Number(activeProduct.price ?? 0))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Availability</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {(activeProduct.stock ?? 0) > 0
                          ? `In stock (${activeProduct.stock ?? 0})`
                          : "Out of stock"}
                      </p>
                    </div>
                  </div>

                  {Number(activeProduct.stock ?? 0) > 0 ? (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AddToCartButton product={activeProduct} size={16} />
                        <span className="text-sm font-medium text-foreground">Add to cart</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-border/60 pt-4 space-y-2">
                      {notifyStatus === "success" ? (
                        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700 font-medium">
                          ✓ You&apos;re on the list! We will email you the moment this gear is back in stock.
                        </div>
                      ) : (
                        <form onSubmit={handleNotifyMe} className="space-y-2 text-left">
                          <p className="text-[11px] font-medium text-muted-foreground leading-normal">
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
                              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground"
                            />
                            <button
                              type="submit"
                              disabled={notifyStatus === "loading"}
                              className="rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
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
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Description</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{activeProduct.description.trim()}</p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Specifications</p>
                  {activeProduct.specifications && Object.keys(activeProduct.specifications).length > 0 ? (
                    <dl className="mt-2 grid gap-2 rounded-xl border bg-background p-3">
                      {Object.entries(activeProduct.specifications)
                        .filter(([k]) => String(k).trim() !== "")
                        .map(([k, v]) => {
                          const label = String(k).trim();
                          const value = formatSpecValue(v);
                          if (!value) return null;
                          return (
                            <div key={label} className="flex items-start justify-between gap-4">
                              <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                              <dd className="text-xs text-foreground text-right">{value}</dd>
                            </div>
                          );
                        })}
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No specifications available.</p>
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

export default function ShopBySportPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md transition-all duration-300">
          <div className="space-y-4 text-center">
            <LogoLoader size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-bold tracking-widest uppercase text-[#0f1a2e] animate-pulse">
                Highlanders
              </p>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8a84b]">
                Sports &amp; Fitness
              </p>
            </div>
          </div>
        </div>
      }
    >
      <ShopBySportPageContent />
    </Suspense>
  );
}
