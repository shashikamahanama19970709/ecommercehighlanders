'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { Product, Sport } from '@/types/product';
import type { ShopBySportModule } from '@/types/shop-by-sport';
import { NoticeBanner, type Notice } from '@/components/notice-banner';

type EntryDraft = {
  sportId: string;
  heroImageKey?: string;
  heroImageUrl?: string;
  productIds: string[];
};

const MAX_SPORTS = 5;
const MIN_PRODUCTS = 1;
const MAX_PRODUCTS = 4;

function emptyDraft(): EntryDraft {
  return { sportId: '', heroImageKey: undefined, heroImageUrl: undefined, productIds: [] };
}

export default function AdminShopBySportPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [moduleDoc, setModuleDoc] = useState<ShopBySportModule | null>(null);

  const [notice, setNotice] = useState<Notice>(null);

  const [entries, setEntries] = useState<EntryDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<EntryDraft>(emptyDraft());
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [productQuery, setProductQuery] = useState('');

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [sportsRes, productsRes, moduleRes] = await Promise.all([
        fetch('/api/sports', { cache: 'no-store' }),
        fetch('/api/products?includeInactive=1', { cache: 'no-store' }),
        fetch('/api/shop-by-sport?includeInactive=1', { cache: 'no-store' }),
      ]);

      const sportsData = (await sportsRes.json()) as Sport[];
      const productsData = (await productsRes.json()) as Product[];
      const moduleData = (await moduleRes.json()) as ShopBySportModule;

      setSports(Array.isArray(sportsData) ? sportsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setModuleDoc(moduleData);

      const existingEntries: EntryDraft[] = Array.isArray(moduleData?.entries)
        ? moduleData.entries
            .slice(0, MAX_SPORTS)
            .map((e) => ({
              sportId: typeof e.sport === 'string' ? e.sport : e.sport?._id ?? '',
              heroImageKey: e.heroImageKey,
              heroImageUrl: e.heroImageUrl,
              productIds: Array.isArray(e.productIds)
                ? e.productIds.map((p) => (typeof p === 'string' ? p : p?._id ?? '')).filter(Boolean)
                : [],
            }))
            .filter((e) => Boolean(e.sportId))
        : [];

      setEntries(existingEntries);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sportsById = useMemo(() => {
    const map = new Map<string, Sport>();
    for (const s of sports) {
      if (s._id) map.set(s._id, s);
    }
    return map;
  }, [sports]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      if (p._id) map.set(p._id, p);
    }
    return map;
  }, [products]);

  const getProductSportId = (p: Product): string | null => {
    if (!p.sport) return null;
    if (typeof p.sport === 'string') return p.sport;
    return p.sport._id ?? null;
  };

  const getProductLabel = (p: Product) => {
    const equipmentName = typeof p.equipment === 'string' ? '' : p.equipment?.name ?? '';
    const brandName = typeof p.brand === 'string' ? '' : p.brand?.name ?? '';
    const modelsValue = (p as unknown as { models?: unknown }).models;
    const specModel = (() => {
      const specs = (p as any)?.specifications;
      if (!specs || typeof specs !== 'object') return '';
      for (const [key, value] of Object.entries(specs as Record<string, unknown>)) {
        if (!key || typeof key !== 'string') continue;
        if (!key.toLowerCase().includes('model')) continue;
        if (typeof value === 'string' && value.trim() !== '') return value.trim();
        if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      }
      return '';
    })();

    const legacyModelFromModelsValue = (() => {
      if (!modelsValue) return '';
      if (typeof modelsValue === 'string' && modelsValue.trim() !== '') return modelsValue.trim();
      if (!Array.isArray(modelsValue)) return '';

      for (const item of modelsValue) {
        if (typeof item === 'string' && item.trim() !== '') return item.trim();
        if (item && typeof item === 'object') {
          const maybeObj = item as { name?: unknown; model?: unknown; value?: unknown };
          if (typeof maybeObj.model === 'string' && maybeObj.model.trim() !== '') return maybeObj.model.trim();
          if (typeof maybeObj.name === 'string' && maybeObj.name.trim() !== '') return maybeObj.name.trim();
          if (typeof maybeObj.value === 'string' && maybeObj.value.trim() !== '') return maybeObj.value.trim();
        }
      }
      return '';
    })();

    const model =
      legacyModelFromModelsValue ||
      (typeof (p as any)?.model === 'string' && (p as any).model.trim() !== '' ? (p as any).model.trim() : '') ||
      specModel ||
      '';
    return [equipmentName || 'Product', brandName || '', model ? `(${model})` : ''].filter(Boolean).join(' ');
  };

  const openCreateModal = () => {
    setEditingIndex(null);
    setDraft(emptyDraft());
    setProductQuery('');
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const entry = entries[index];
    if (!entry) return;
    setEditingIndex(index);
    setDraft({ ...entry, productIds: [...entry.productIds] });
    setProductQuery('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
    setDraft(emptyDraft());
    setIsUploadingHero(false);
    setProductQuery('');
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadHeroImageForDraft = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Shop by sport upload failed.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Shop by sport upload failed.' });
      return;
    }

    setIsUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'shop-by-sport');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setNotice({
          type: 'error',
          message: (err as any)?.message
            ? `Shop by sport upload failed: ${(err as any).message}`
            : 'Shop by sport upload failed.',
        });
        return;
      }

      const data = (await res.json()) as { key: string; signedUrl: string };
      setDraft((prev) => ({
        ...prev,
        heroImageKey: data.key,
        heroImageUrl: data.signedUrl,
      }));
    } finally {
      setIsUploadingHero(false);
    }
  };

  const saveDraftToList = () => {
    if (!draft.sportId) {
      setNotice({ type: 'error', message: 'Select a sport' });
      return;
    }
    if (!draft.heroImageKey) {
      setNotice({ type: 'error', message: 'Upload a hero image' });
      return;
    }
    if (draft.productIds.length < MIN_PRODUCTS || draft.productIds.length > MAX_PRODUCTS) {
      setNotice({ type: 'error', message: `Select ${MIN_PRODUCTS}–${MAX_PRODUCTS} products` });
      return;
    }

    setEntries((prev) => {
      // If creating and sport already exists, overwrite that existing card.
      if (editingIndex === null) {
        const existingIndex = prev.findIndex((e) => e.sportId === draft.sportId);
        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = { ...draft, productIds: [...draft.productIds] };
          return next;
        }
        if (prev.length >= MAX_SPORTS) return prev;
        return [...prev, { ...draft, productIds: [...draft.productIds] }];
      }

      // Editing: ensure uniqueness (if sport is already used elsewhere, unselect it there).
      let next = [...prev];
      const otherIndex = next.findIndex((e, i) => i !== editingIndex && e.sportId === draft.sportId);
      if (otherIndex !== -1) {
        next.splice(otherIndex, 1);
      }

      const targetIndex = otherIndex !== -1 && otherIndex < editingIndex ? editingIndex - 1 : editingIndex;
      next[targetIndex] = { ...draft, productIds: [...draft.productIds] };
      return next;
    });

    closeModal();
  };

  const validateEntries = () => {
    if (entries.length === 0) return 'Select at least 1 sport';
    if (entries.length > MAX_SPORTS) return 'You can select at most 5 sports';

    for (const e of entries) {
      if (!e.sportId) return 'Each entry must have a sport';
      if (!e.heroImageKey) return 'Upload a hero image for each selected sport';
      if (e.productIds.length < MIN_PRODUCTS || e.productIds.length > MAX_PRODUCTS) {
        return 'Each sport must have 1 to 4 products selected';
      }
    }

    const unique = new Set(entries.map((e) => e.sportId));
    if (unique.size !== entries.length) return 'Each sport can only be selected once';

    return null;
  };

  const saveModule = async () => {
    const err = validateEntries();
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        isActive: true,
        entries: entries.slice(0, MAX_SPORTS).map((e) => ({
          sport: e.sportId,
          heroImageKey: e.heroImageKey,
          productIds: e.productIds,
        })),
      };

      const res = await fetch('/api/shop-by-sport', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const out = await res.json().catch(() => ({}));
        setNotice({ type: 'error', message: (out as any)?.message ?? 'Shop by sport update failed.' });
        return;
      }

      setNotice({ type: 'success', message: 'Shop by sport updated successfully.' });
      await loadAll();
    } finally {
      setIsSaving(false);
    }
  };

  const sportName = (sportId: string) => sportsById.get(sportId)?.name ?? 'Sport';

  const draftSportProducts = useMemo(() => {
    if (!draft.sportId) return [] as Product[];

    const query = productQuery.trim().toLowerCase();
    const inSport = products.filter((p) => getProductSportId(p) === draft.sportId);

    const sorted = [...inSport].sort((a, b) => {
      const aLabel = getProductLabel(a).toLowerCase();
      const bLabel = getProductLabel(b).toLowerCase();
      return aLabel.localeCompare(bLabel);
    });

    if (!query) return sorted;
    return sorted.filter((p) => getProductLabel(p).toLowerCase().includes(query));
  }, [draft.sportId, products, productQuery]);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Shop by sport module</h1>
            <p className="text-xs text-muted-foreground">
              Create up to {MAX_SPORTS} sports, each with a hero image and {MIN_PRODUCTS}–{MAX_PRODUCTS} products.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              className="cursor-pointer rounded-full border border-border bg-background px-3 py-2 text-xs hover:bg-accent"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              disabled={entries.length >= MAX_SPORTS}
              className="cursor-pointer rounded-full border border-border bg-background px-3 py-2 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add sport
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={saveModule}
              className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {isSaving ? 'Saving…' : 'Save module'}
            </button>
          </div>
        </div>

        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        <div className="rounded-2xl border bg-background p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Configured sports</h2>
              <p className="text-[11px] text-muted-foreground">Showing {entries.length} of {MAX_SPORTS}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-dashed bg-muted p-6 text-center text-xs text-muted-foreground">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted p-8 text-center text-sm text-muted-foreground">
              No sports configured yet. Click “Add sport” to create your first card.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry, idx) => {
                const heroUrl = entry.heroImageUrl;
                const name = sportName(entry.sportId);
                const selectedProducts = entry.productIds
                  .map((id) => productsById.get(id))
                  .filter(Boolean) as Product[];

                return (
                  <article
                    key={`${entry.sportId}-${idx}`}
                    className="flex flex-col overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-40 w-full bg-muted">
                      {heroUrl ? (
                        <Image src={heroUrl} alt={name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">No hero image</div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-4 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            Products: <span className="font-medium text-foreground">{entry.productIds.length}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(idx)}
                            className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-[11px] hover:bg-accent"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEntry(idx)}
                            className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-[11px] hover:bg-accent"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-1 rounded-xl bg-muted p-3">
                        {selectedProducts.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">No products selected</p>
                        ) : (
                          <div className="space-y-1">
                            {selectedProducts.slice(0, 3).map((p) => (
                              <p key={p._id} className="truncate text-[11px] text-foreground">
                                {getProductLabel(p)}
                              </p>
                            ))}
                            {selectedProducts.length > 3 && (
                              <p className="text-[11px] text-muted-foreground">+{selectedProducts.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="mt-auto text-[11px] text-muted-foreground">
                        Tip: choosing a sport that already exists will replace that card.
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {moduleDoc && (
          <div className="rounded-2xl border bg-background p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current module</h2>
            <p className="text-[11px] text-muted-foreground">Entries in DB: {moduleDoc.entries?.length ?? 0}</p>
          </div>
        )}

        {/* Entry modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border bg-background shadow-lg">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {editingIndex === null ? 'Create sport card' : 'Edit sport card'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">Pick a sport, upload a hero image, and select 1–4 products.</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[80vh] overflow-auto p-5">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Sport</p>
                    <select
                      value={draft.sportId}
                      onChange={(e) => {
                        const nextSportId = e.target.value;
                        setDraft((prev) => ({ ...prev, sportId: nextSportId, productIds: [] }));
                      }}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    >
                      <option value="">Select sport</option>
                      {sports.map((s) => (
                        <option key={s._id} value={s._id ?? ''}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-5 md:grid-cols-[240px_1fr]">
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground">Hero image</p>
                      <div className="rounded-xl border bg-muted p-3">
                        {draft.heroImageUrl ? (
                          <div className="relative h-28 w-full overflow-hidden rounded-lg bg-background">
                            <Image src={draft.heroImageUrl} alt="Hero" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-background text-[11px] text-muted-foreground">
                            No image
                          </div>
                        )}

                        <div className="mt-3">
                          <input
                            type="file"
                            accept="image/*"
                            id="hero-upload-modal"
                            className="hidden"
                            disabled={!draft.sportId || isUploadingHero}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadHeroImageForDraft(file);
                            }}
                          />
                          <label
                            htmlFor="hero-upload-modal"
                            className={`inline-flex w-full cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-xs ${
                              !draft.sportId || isUploadingHero
                                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                                : 'bg-background hover:bg-accent'
                            }`}
                          >
                            {isUploadingHero ? 'Uploading…' : 'Upload hero image'}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Bottom card products ({draft.productIds.length}/{MAX_PRODUCTS})
                          </p>
                          <p className="text-[11px] text-muted-foreground">Select {MIN_PRODUCTS}–{MAX_PRODUCTS}</p>
                        </div>
                        <input
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Search products…"
                          className="w-56 rounded-md border border-border bg-background px-3 py-2 text-xs"
                          disabled={!draft.sportId}
                        />
                      </div>

                      {!draft.sportId ? (
                        <div className="rounded-lg border border-dashed bg-muted p-6 text-center text-xs text-muted-foreground">
                          Select a sport to choose products.
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-auto rounded-xl border bg-background">
                          {draftSportProducts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">No products found for this sport.</div>
                          ) : (
                            <div className="divide-y">
                              {draftSportProducts.map((p) => {
                                const pid = p._id ?? '';
                                const checked = pid ? draft.productIds.includes(pid) : false;
                                const disabled = !checked && draft.productIds.length >= MAX_PRODUCTS;

                                return (
                                  <label
                                    key={p._id}
                                    className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-xs hover:bg-accent ${
                                      disabled ? 'opacity-60' : ''
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-foreground">{getProductLabel(p)}</p>
                                      <p className="truncate text-[11px] text-muted-foreground">Stock: {p.stock ?? 0}</p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={disabled}
                                      onChange={() => {
                                        if (!pid) return;
                                        setDraft((prev) => {
                                          const has = prev.productIds.includes(pid);
                                          if (has) {
                                            return { ...prev, productIds: prev.productIds.filter((id) => id !== pid) };
                                          }
                                          if (prev.productIds.length >= MAX_PRODUCTS) return prev;
                                          return { ...prev, productIds: [...prev.productIds, pid] };
                                        });
                                      }}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="cursor-pointer rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-accent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDraftToList}
                      className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
