'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import type { Sport, CategorySchema, FieldDefinition, Brand, Product } from '@/types/product';

const LOW_STOCK_THRESHOLD = 5;

type StockFilter = 'all' | 'in' | 'out' | 'low';

const baseSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  equipment: z.string().min(1, 'Equipment is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().min(0, 'Stock must be non-negative').optional(),
  featureImageKey: z.string().optional(),
  imageKeys: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
});

type FormData = z.infer<typeof baseSchema>;

export default function AdminProductsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [schema, setSchema] = useState<CategorySchema | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [featureImagePreview, setFeatureImagePreview] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [filters, setFilters] = useState<{ sport: string; equipment: string; brand: string; model: string; stock: StockFilter }>({
    sport: '',
    equipment: '',
    brand: '',
    model: '',
    stock: 'all',
  });

  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(0);
  const [isRestocking, setIsRestocking] = useState(false);

  const { control, handleSubmit, watch, reset, setValue, clearErrors, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      sport: '',
      equipment: '',
      brand: '',
      model: '',
      price: 0,
      stock: 0,
      specifications: {},
      featureImageKey: '',
      imageKeys: [],
    },
  });

  const watchedSport = watch('sport');
  const watchedEquipment = watch('equipment');

  // Fetch sports on mount
  useEffect(() => {
    fetchSports();
    fetchProducts();
  }, []);

  const fetchSports = async () => {
    const response = await fetch('/api/sports');
    const data = await response.json();
    setSports(data);
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/products?includeInactive=1', { cache: 'no-store' });
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchBrands = async (sportId?: string) => {
    const url = sportId ? `/api/brands?sportId=${sportId}` : '/api/brands';
    const response = await fetch(url);
    const data = await response.json();
    setBrands(data);
  };

  // Update equipment types and brands when sport changes
  useEffect(() => {
    if (watchedSport) {
      const sport = sports.find((s: Sport) => s.name === watchedSport);
      setEquipmentTypes(sport?.equipmentTypes || []);
      setSchema(null);
      fetchBrands(sport?._id);
    } else {
      setBrands([]);
    }
  }, [watchedSport, sports]);

  // Fetch schema when equipment changes
  useEffect(() => {
    if (watchedEquipment) {
      fetch(`/api/schemas?type=${encodeURIComponent(watchedEquipment)}`)
        .then(res => res.json())
        .then(data => {
          // Ensure fields is always an array
          if (data && !data.fields) {
            data.fields = [];
          }
          setSchema(data);
        })
        .catch(error => {
          console.error('Error fetching schema:', error);
          setSchema(null);
        });
    } else {
      setSchema(null);
    }
  }, [watchedEquipment]);

  const handleFeatureImageUpload = async (file: File) => {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setValue('featureImageKey', data.key);
        setFeatureImagePreview(data.signedUrl);
        clearErrors('featureImageKey');
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const currentImages = control._formValues.imageKeys || [];
        setValue('imageKeys', [...currentImages, data.key]);
        setImagePreviews(prev => [...prev, data.signedUrl]);
        clearErrors('imageKeys');
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const currentImages = control._formValues.imageKeys || [];
    const newImages = currentImages.filter((_: string, i: number) => i !== index);
    setValue('imageKeys', newImages);
    setImagePreviews(prev => prev.filter((_: string, i: number) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const submitData: Omit<FormData, 'featureImageKey' | 'imageKeys'> & {
        featureImageKey?: string;
        imageKeys?: string[];
        models?: string[];
      } = {
        ...data,
      };

      submitData.models = data.model ? [data.model] : [];

      // Only include image keys if they exist
      if (data.featureImageKey && data.featureImageKey.trim()) {
        submitData.featureImageKey = data.featureImageKey;
      }
      if (data.imageKeys && data.imageKeys.length > 0) {
        submitData.imageKeys = data.imageKeys;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        alert('Product created successfully!');
        reset();
        setSchema(null);
        setBrands([]);
        setFeatureImagePreview('');
        setImagePreviews([]);
        setShowCreateForm(false);
        await fetchProducts();
      } else {
        alert('Error creating product');
      }
    } catch {
      alert('Error creating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: FormData) => {
    if (!editProduct?._id) return;
    setIsSubmitting(true);
    try {
      const submitData: Omit<FormData, 'featureImageKey' | 'imageKeys'> & {
        featureImageKey?: string;
        imageKeys?: string[];
        models?: string[];
      } = {
        ...data,
      };

      submitData.models = data.model ? [data.model] : [];

      // Always send image keys on edit so the API can keep/clear correctly.
      submitData.featureImageKey = (data.featureImageKey ?? '').toString();
      submitData.imageKeys = Array.isArray(data.imageKeys) ? data.imageKeys : [];

      const response = await fetch(`/api/products/${editProduct._id}` , {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        alert(err?.message || 'Error updating product');
        return;
      }

      alert('Product updated successfully!');
      setEditProduct(null);
      reset();
      setSchema(null);
      setBrands([]);
      setFeatureImagePreview('');
      setImagePreviews([]);
      await fetchProducts();
    } catch {
      alert('Error updating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRefName = (value: Product['sport'] | Product['brand'] | Product['equipment']) => {
    if (!value) return '';
    if (typeof value === 'string') return '';
    return value?.name ?? '';
  };

  const getModel = (product: Product) => (product.models && product.models.length > 0 ? product.models[0] : '');

  const sportNameFromProduct = (p: Product) => getRefName(p.sport);
  const equipmentNameFromProduct = (p: Product) => getRefName(p.equipment);
  const brandNameFromProduct = (p: Product) => getRefName(p.brand);

  const equipmentFilterOptions = Array.from(
    new Set(
      products
        .filter((p) => (filters.sport ? sportNameFromProduct(p) === filters.sport : true))
        .map((p) => equipmentNameFromProduct(p))
        .filter(Boolean)
    )
  ).sort();

  const brandFilterOptions = Array.from(
    new Set(
      products
        .filter((p) => (filters.sport ? sportNameFromProduct(p) === filters.sport : true))
        .filter((p) => (filters.equipment ? equipmentNameFromProduct(p) === filters.equipment : true))
        .map((p) => brandNameFromProduct(p))
        .filter(Boolean)
    )
  ).sort();

  const filteredProducts = products.filter((p) => {
    const sportName = getRefName(p.sport);
    const equipmentName = getRefName(p.equipment);
    const brandName = getRefName(p.brand);
    const model = getModel(p);
    const stock = p.stock ?? 0;

    if (filters.sport && sportName !== filters.sport) return false;
    if (filters.equipment && equipmentName !== filters.equipment) return false;
    if (filters.brand && brandName !== filters.brand) return false;
    if (filters.model && !model.toLowerCase().includes(filters.model.toLowerCase())) return false;

    if (filters.stock === 'in' && stock <= 0) return false;
    if (filters.stock === 'out' && stock > 0) return false;
    if (filters.stock === 'low' && stock > LOW_STOCK_THRESHOLD) return false;

    return true;
  });

  const lowStockProducts = products.filter((p) => {
    const stock = p.stock ?? 0;
    return stock <= LOW_STOCK_THRESHOLD;
  });

  const openRestock = (product: Product) => {
    setRestockProduct(product);
    setRestockAmount(0);
  };

  const openEdit = (product: Product) => {
    setShowCreateForm(false);
    setRestockProduct(null);
    setRestockAmount(0);
    setEditProduct(product);

    const featureUrl = product.featureImageUrl || product.imageUrls?.[0] || product.images?.[0] || '';

    const galleryUrls = product.imageUrls || product.images || [];

    reset({
      sport: getRefName(product.sport) || '',
      equipment: getRefName(product.equipment) || '',
      brand: getRefName(product.brand) || '',
      model: getModel(product) || '',
      price: Number(product.price ?? 0),
      stock: Number(product.stock ?? 0),
      specifications: product.specifications ?? {},
      featureImageKey: product.featureImageKey ?? '',
      imageKeys: product.imageKeys ?? [],
    });

    setFeatureImagePreview(featureUrl);
    setImagePreviews(galleryUrls);
  };

  const closeProductModal = () => {
    setShowCreateForm(false);
    setEditProduct(null);
    reset();
    setSchema(null);
    setBrands([]);
    setFeatureImagePreview('');
    setImagePreviews([]);
  };

  const closeRestock = () => {
    setRestockProduct(null);
    setRestockAmount(0);
  };

  const submitRestock = async () => {
    if (!restockProduct?._id) return;
    if (!Number.isFinite(restockAmount) || restockAmount <= 0) {
      alert('Enter a restock amount greater than 0');
      return;
    }

    setIsRestocking(true);
    try {
      const response = await fetch(`/api/products/${restockProduct._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDelta: restockAmount }),
      });

      if (!response.ok) {
        alert('Failed to restock');
        return;
      }

      // Keep populated names in UI; update stock locally and then refresh.
      setProducts((prev) =>
        prev.map((p) =>
          p._id === restockProduct._id ? { ...p, stock: (p.stock ?? 0) + restockAmount } : p
        )
      );
      closeRestock();
      await fetchProducts();
    } catch {
      alert('Failed to restock');
    } finally {
      setIsRestocking(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const fieldName = `specifications.${field.name}` as const;

    switch (field.type) {
      case 'select':
        return (
          <Controller
            key={field.name}
            name={fieldName}
            control={control}
            rules={{ required: field.required }}
            render={({ field: controllerField }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                <select
                  {...controllerField}
                  value={controllerField.value as string || ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}
          />
        );

      case 'number':
        return (
          <Controller
            key={field.name}
            name={fieldName}
            control={control}
            defaultValue={0}
            rules={{ required: field.required, min: 0 }}
            render={({ field: controllerField }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                <input
                  {...controllerField}
                  type="number"
                  step="0.01"
                  value={controllerField.value as number || 0}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  onChange={e => controllerField.onChange(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          />
        );

      default:
        return (
          <Controller
            key={field.name}
            name={fieldName}
            control={control}
            rules={{ required: field.required }}
            render={({ field: controllerField }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                <input
                  {...controllerField}
                  type="text"
                  value={controllerField.value as string || ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
          <p className="text-muted-foreground">Create, view, filter, and restock products</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {isLoadingProducts ? 'Loading products…' : `Showing ${filteredProducts.length} of ${products.length} products`}
          </div>
          <button
            type="button"
            onClick={() => {
              if (showCreateForm) {
                closeProductModal();
                return;
              }
              setEditProduct(null);
              reset();
              setSchema(null);
              setBrands([]);
              setFeatureImagePreview('');
              setImagePreviews([]);
              setShowCreateForm(true);
            }}
            className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90"
          >
            {showCreateForm ? 'Close Form' : 'Create New Product'}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl border bg-background/80 p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sport: e.target.value, equipment: '', brand: '' }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">All</option>
                {sports.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Equipment</label>
              <select
                value={filters.equipment}
                onChange={(e) => setFilters((prev) => ({ ...prev, equipment: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">All</option>
                {equipmentFilterOptions.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">All</option>
                {brandFilterOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Model</label>
              <input
                value={filters.model}
                onChange={(e) => setFilters((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Search model…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Stock</label>
              <select
                value={filters.stock}
                onChange={(e) => setFilters((prev) => ({ ...prev, stock: e.target.value as StockFilter }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="all">All</option>
                <option value="in">In stock</option>
                <option value="out">Out of stock</option>
                <option value="low">Low stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Low stock section */}
        <div className="mb-8 rounded-xl border bg-background/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Low stock</h2>
              <p className="text-xs text-muted-foreground">Products with stock ≤ {LOW_STOCK_THRESHOLD}</p>
            </div>
            <button
              type="button"
              onClick={fetchProducts}
              className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent"
            >
              Refresh
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted p-6 text-center text-xs text-muted-foreground">
              No low-stock products.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {lowStockProducts.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg border bg-background p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      {getRefName(p.equipment) || 'Product'}
                      {getModel(p) ? ` • ${getModel(p)}` : ''}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {getRefName(p.sport) || '—'} • {getRefName(p.brand) || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-medium text-orange-700">
                      Stock: {p.stock ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => openRestock(p)}
                      className="cursor-pointer rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background hover:bg-foreground/90"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl bg-background/80 p-6 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Use filters to find products quickly. Click “Create New Product” to add a new item.
            </p>
          </div>

          <div className="rounded-xl bg-background/80 p-6 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Use “Restock” in the low-stock list or product cards to increase stock.
            </p>
          </div>
        </div>

        {/* Products grid */}
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Products</h2>
          {isLoadingProducts ? (
            <div className="rounded-xl border bg-background p-8 text-center text-xs text-muted-foreground">
              Loading…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted p-8 text-center text-xs text-muted-foreground">
              No products match the selected filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => {
                const stock = p.stock ?? 0;
                const badge = stock <= 0 ? 'Out of stock' : stock <= LOW_STOCK_THRESHOLD ? 'Low stock' : 'In stock';
                const badgeClass =
                  stock <= 0
                    ? 'bg-red-100 text-red-700'
                    : stock <= LOW_STOCK_THRESHOLD
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700';

                const img =
                  p.featureImageUrl ||
                  (Array.isArray(p.imageUrls) ? p.imageUrls[0] : undefined) ||
                  p.images?.[0];

                return (
                  <div key={p._id} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                    <div className="relative h-36 w-full bg-muted">
                      {img ? (
                        <Image src={img} alt={getRefName(p.equipment) || p._id || 'Product'} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {getRefName(p.sport) || '—'}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>{badge}</span>
                      </div>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {getRefName(p.equipment) || 'Product'}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {getRefName(p.brand) || '—'}{getModel(p) ? ` • ${getModel(p)}` : ''}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm font-semibold text-foreground">
                          ${Number(p.price ?? 0).toFixed(2)}
                          <span className="ml-1 text-[10px] text-muted-foreground">USD</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                            Stock: {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openRestock(p)}
                            className="cursor-pointer rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background hover:bg-foreground/90"
                          >
                            Restock
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create/Edit modal */}
        {(showCreateForm || !!editProduct) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border bg-background shadow-lg">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{editProduct ? 'Edit Product' : 'Create New Product'}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {editProduct ? 'Update details and save changes.' : 'Fill the form to add a product.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[80vh] overflow-auto p-5">
                <form onSubmit={handleSubmit(editProduct ? onSubmitEdit : onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Basic Information</h3>

                <Controller
                  name="sport"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sport</label>
                      <select
                        {...field}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select Sport</option>
                        {sports.map(sport => (
                          <option key={sport._id} value={sport.name}>{sport.name}</option>
                        ))}
                      </select>
                      {errors.sport && <p className="text-sm text-red-600">{errors.sport.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="equipment"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Equipment Type</label>
                      <select
                        {...field}
                        disabled={!watchedSport}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">Select Equipment</option>
                        {equipmentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {errors.equipment && <p className="text-sm text-red-600">{errors.equipment.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Brand</label>
                      <select
                        {...field}
                        disabled={!watchedSport}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">Select Brand</option>
                        {brands.map(brand => (
                          <option key={brand._id} value={brand.name}>{brand.name}</option>
                        ))}
                      </select>
                      {errors.brand && <p className="text-sm text-red-600">{errors.brand.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="model"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Model</label>
                      <input
                        {...field}
                        type="text"
                        placeholder="e.g., Pro, 2026, XL"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-muted-foreground">Images uploaded below will be used for this model.</p>
                      {errors.model && <p className="text-sm text-red-600">{errors.model.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price ($)</label>
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="stock"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stock</label>
                      <input
                        {...field}
                        type="number"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                      {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
                    </div>
                  )}
                />
              </div>

              {/* Product Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Product Images</h3>

                {/* Feature Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Feature Image</label>
                  <div className="space-y-3">
                    {featureImagePreview && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                          <Image
                            src={featureImagePreview}
                            alt="Feature image preview"
                            width={64}
                            height={64}
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=Product&background=6366f1&color=ffffff&size=64&font-size=0.6`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Feature image uploaded</p>
                          <p className="text-xs text-gray-500">This will be the main product image</p>
                        </div>
                      </div>
                    )}

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFeatureImageUpload(file);
                        }}
                        className="hidden"
                        id="feature-image-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="feature-image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="text-center">
                          {uploadingImage ? (
                            <p className="text-sm text-blue-600">Uploading...</p>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">Upload feature image</p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    <Controller
                      name="featureImageKey"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                  </div>
                  {errors.featureImageKey && <p className="text-sm text-red-600">{errors.featureImageKey.message}</p>}
                </div>

                {/* Additional Images */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Images</label>
                  <div className="space-y-3">
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                              <Image
                                src={preview}
                                alt={`Product image ${index + 1}`}
                                width={96}
                                height={96}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=Img${index + 1}&background=6366f1&color=ffffff&size=96&font-size=0.6`;
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => handleImageUpload(file));
                        }}
                        className="hidden"
                        id="product-images-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="product-images-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="text-center">
                          {uploadingImage ? (
                            <p className="text-sm text-blue-600">Uploading...</p>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">Add product images</p>
                              <p className="text-xs text-gray-500">Select multiple images (PNG, JPG, GIF up to 10MB each)</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    <Controller
                      name="imageKeys"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                  </div>
                  {errors.imageKeys && <p className="text-sm text-red-600">{errors.imageKeys.message}</p>}
                </div>
              </div>

              {/* Dynamic Specifications */}
              {schema && schema.fields && schema.fields.length > 0 && (
                <div className="space-y-4 rounded-lg bg-blue-50/50 p-4">
                  <h3 className="text-lg font-medium text-gray-900">Specifications</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {schema.fields.map((field) => renderField(field))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {editProduct ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create Product')}
              </button>
            </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Restock modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Restock product</h3>
              <button
                type="button"
                onClick={closeRestock}
                className="cursor-pointer rounded-full border border-border px-2 py-1 text-xs hover:bg-accent"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Sport</p>
                  <p className="rounded-md border bg-muted px-3 py-2">{getRefName(restockProduct.sport) || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Equipment</p>
                  <p className="rounded-md border bg-muted px-3 py-2">{getRefName(restockProduct.equipment) || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Brand</p>
                  <p className="rounded-md border bg-muted px-3 py-2">{getRefName(restockProduct.brand) || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Model</p>
                  <p className="rounded-md border bg-muted px-3 py-2">{getModel(restockProduct) || '—'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">Add stock</p>
                <input
                  type="number"
                  min={1}
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
                <p className="text-[11px] text-muted-foreground">
                  Current stock: <span className="font-medium text-foreground">{restockProduct.stock ?? 0}</span>
                </p>
              </div>

              <button
                type="button"
                disabled={isRestocking}
                onClick={submitRestock}
                className="cursor-pointer w-full rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                {isRestocking ? 'Restocking…' : 'Restock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}