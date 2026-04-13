"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ShopBySportEntry, ShopBySportModule } from "@/types/shop-by-sport";
import type { Product } from "@/types/product";

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

function extractProducts(entry: ShopBySportEntry): Product[] {
  if (Array.isArray(entry.products) && entry.products.length > 0) return entry.products;
  const populated = Array.isArray(entry.productIds) ? entry.productIds : [];
  return populated.filter((p): p is Product => typeof p !== "string" && !!p);
}

export default function ShopBySportPage() {
  const [moduleDoc, setModuleDoc] = useState<ShopBySportModule | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/shop-by-sport", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch Shop by sport module");
        const data = (await res.json()) as ShopBySportModule;
        setModuleDoc(data);
        setSelectedIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const entries = useMemo(() => {
    return Array.isArray(moduleDoc?.entries) ? moduleDoc!.entries : [];
  }, [moduleDoc]);

  const selectedEntry = entries[selectedIndex];
  const selectedSportName = selectedEntry ? getName(selectedEntry.sport) || "Sport" : "";
  const selectedProducts = selectedEntry ? extractProducts(selectedEntry).slice(0, 4) : [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-muted p-10 text-center text-sm text-muted-foreground">Loading…</div>
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

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-dashed bg-muted p-10 text-center text-sm text-muted-foreground">Shop by sport module is not configured yet.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shop by sport</h1>
          <p className="text-sm text-muted-foreground">Pick a sport to see curated products.</p>
        </div>
        <Link href="/" className="rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-accent">
          Back to home
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {entries.map((entry, idx) => {
          const sportName = getName(entry.sport) || `Sport ${idx + 1}`;
          const isActive = idx === selectedIndex;
          return (
            <button
              key={`${sportName}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`rounded-full border border-border px-3 py-1 text-xs hover:bg-accent ${isActive ? "bg-accent" : "bg-background"}`}
            >
              {sportName}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        <div className="relative overflow-hidden rounded-3xl border bg-muted">
          <div className="relative h-56 w-full">
            {selectedEntry?.heroImageUrl ? (
              <Image src={selectedEntry.heroImageUrl} alt={selectedSportName} fill className="object-cover" />
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {selectedProducts.map((p) => {
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
              <article key={p._id} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                <div className="relative h-32 w-full bg-muted">
                  {img ? (
                    <Image src={img} alt={equipmentName} fill className="object-cover" />
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
                    <span className="text-sm font-semibold text-foreground">${Number(p.price ?? 0).toFixed(2)}</span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {stock > 0 ? "In stock" : "Out"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
