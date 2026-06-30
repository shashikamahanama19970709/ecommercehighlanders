'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import type { Sport, CategorySchema, FieldDefinition, Brand, Product } from '@/types/product';
import { NoticeBanner, type Notice } from '@/components/notice-banner';
import { Search, Plus, Edit, Trash2, RefreshCw, AlertTriangle, X, Upload } from 'lucide-react';

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

  const [notice, setNotice] = useState<Notice>(null);

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');

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
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const response = await fetch('/api/settings/currency');
      const data = await response.json();
      const base = data.baseCurrency || 'USD';
      const currencies = data.currencies || [];
      const match = currencies.find((c: any) => c.code === base) || { symbol: '$' };
      setBaseCurrency(base);
      setCurrencySymbol(match.symbol || '$');
    } catch {
      setBaseCurrency('USD');
      setCurrencySymbol('$');
    }
  };

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
      setNotice({ type: 'error', message: 'Products upload failed.' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Products upload failed.' });
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
        setNotice({
          type: 'error',
          message: error?.message ? `Products upload failed: ${error.message}` : 'Products upload failed.',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotice({ type: 'error', message: 'Products upload failed.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Products upload failed.' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Products upload failed.' });
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
        setNotice({
          type: 'error',
          message: error?.message ? `Products upload failed: ${error.message}` : 'Products upload failed.',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotice({ type: 'error', message: 'Products upload failed.' });
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
        setNotice({ type: 'success', message: 'Products created successfully.' });
        reset();
        setSchema(null);
        setBrands([]);
        setFeatureImagePreview('');
        setImagePreviews([]);
        setShowCreateForm(false);
        await fetchProducts();
      } else {
        setNotice({ type: 'error', message: 'Products create failed.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Products create failed.' });
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

      const response = await fetch(`/api/products/${editProduct._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        setNotice({ type: 'error', message: err?.message || 'Products update failed.' });
        return;
      }

      setNotice({ type: 'success', message: 'Products updated successfully.' });
      setEditProduct(null);
      reset();
      setSchema(null);
      setBrands([]);
      setFeatureImagePreview('');
      setImagePreviews([]);
      await fetchProducts();
    } catch {
      setNotice({ type: 'error', message: 'Products update failed.' });
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

  // Reset page to 1 on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Adjust pagination if products count changes
  useEffect(() => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

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
      setNotice({ type: 'error', message: 'Products update failed.' });
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
        setNotice({ type: 'error', message: 'Products update failed.' });
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
      setNotice({ type: 'success', message: 'Products updated successfully.' });
    } catch {
      setNotice({ type: 'error', message: 'Products update failed.' });
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{field.label}</label>
                <select
                  {...controllerField}
                  value={controllerField.value as string || ''}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{field.label}</label>
                <input
                  {...controllerField}
                  type="number"
                  step="0.01"
                  value={controllerField.value as number || 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                  onChange={e => controllerField.onChange(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          />
        );

      case 'weight':
        return (
          <Controller
            key={field.name}
            name={fieldName}
            control={control}
            defaultValue={0}
            rules={{ required: field.required, min: 0 }}
            render={({ field: controllerField }) => (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{field.label}</label>
                <input
                  {...controllerField}
                  type="number"
                  step="0.01"
                  value={controllerField.value as number || 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                  onChange={e => controllerField.onChange(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          />
        );

      case 'color':
        return (
          <Controller
            key={field.name}
            name={fieldName}
            control={control}
            rules={{ required: field.required }}
            render={({ field: controllerField }) => (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{field.label}</label>
                <input
                  {...controllerField}
                  type="text"
                  value={controllerField.value as string || ''}
                  placeholder="#RRGGBB"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{field.label}</label>
                <input
                  {...controllerField}
                  type="text"
                  value={controllerField.value as string || ''}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                />
              </div>
            )}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#0f1a2e]">Product Management</h1>
          <p className="text-xs text-slate-400 mt-1">Create, view, filter, and restock products</p>
        </div>

        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        {/* Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-400">
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
            className="cursor-pointer rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
          >
            {showCreateForm ? 'Close Form' : 'Create New Product'}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0f1a2e]">Filter Products</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sport: e.target.value, equipment: '', brand: '' }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
              >
                <option value="">All Sports</option>
                {sports.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Equipment</label>
              <select
                value={filters.equipment}
                onChange={(e) => setFilters((prev) => ({ ...prev, equipment: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
              >
                <option value="">All Equipment</option>
                {equipmentFilterOptions.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
              >
                <option value="">All Brands</option>
                {brandFilterOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</label>
              <input
                value={filters.model}
                onChange={(e) => setFilters((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Search model…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock</label>
              <select
                value={filters.stock}
                onChange={(e) => setFilters((prev) => ({ ...prev, stock: e.target.value as StockFilter }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
              >
                <option value="all">All Items</option>
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
                <option value="low">Low Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Low stock section */}
        <div className="mb-8 rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0f1a2e] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#c8a84b]" />
                <span>Low Stock Alerts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Products with stock ≤ {LOW_STOCK_THRESHOLD}</p>
            </div>
            <button
              type="button"
              onClick={fetchProducts}
              className="cursor-pointer rounded-full border border-slate-200 hover:bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-600 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs font-bold text-slate-400">
              All items are well stocked.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lowStockProducts.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#0f1a2e]">
                      {getRefName(p.equipment) || 'Product'}
                      {getModel(p) ? ` • ${getModel(p)}` : ''}
                    </p>
                    <p className="truncate text-[10px] font-semibold text-slate-400 mt-0.5">
                      {getRefName(p.sport) || '—'} • {getRefName(p.brand) || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-bold text-amber-700">
                      Stock: {p.stock ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => openRestock(p)}
                      className="cursor-pointer rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products grid */}
        <div className="mt-10">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#0f1a2e] border-b border-slate-100 pb-3">Products Inventory</h2>
          {isLoadingProducts ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-xs font-bold text-slate-400">
              Loading inventory…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-xs font-bold text-slate-400">
              No products match the selected filters.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map((p) => {
                  const stock = p.stock ?? 0;
                  const badge = stock <= 0 ? 'Out of stock' : stock <= LOW_STOCK_THRESHOLD ? 'Low stock' : 'In stock';
                  const badgeClass =
                    stock <= 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : stock <= LOW_STOCK_THRESHOLD
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  const img =
                    p.featureImageUrl ||
                    (Array.isArray(p.imageUrls) ? p.imageUrls[0] : undefined) ||
                    p.images?.[0];

                  return (
                    <div key={p._id} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className="relative h-44 w-full bg-slate-50 border-b border-slate-100 overflow-hidden">
                        {img ? (
                          <Image src={img} alt={getRefName(p.equipment) || p._id || 'Product'} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100">
                            No image available
                          </div>
                        )}
                        {/* Badge at top right */}
                        <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>{badge}</span>
                      </div>
                      <div className="space-y-2.5 p-5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8a84b]">
                            {getRefName(p.sport) || '—'}
                          </p>
                          <span className="rounded-full bg-slate-50 border border-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                            Stock: {stock}
                          </span>
                        </div>
                        <p className="truncate text-sm font-bold text-[#0f1a2e]">
                          {getRefName(p.equipment) || 'Product'}
                        </p>
                        <p className="truncate text-[11px] font-semibold text-slate-400">
                          {getRefName(p.brand) || '—'}{getModel(p) ? ` • ${getModel(p)}` : ''}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="text-sm font-black text-[#0f1a2e]">
                            {currencySymbol}{Number(p.price ?? 0).toFixed(2)}
                            <span className="ml-1 text-[9px] font-bold text-slate-400">{baseCurrency}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="cursor-pointer rounded-full border border-slate-200 hover:border-[#0f1a2e] hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-black transition-all"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openRestock(p)}
                              className="cursor-pointer rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
                  <p className="text-xs text-slate-500 font-semibold">
                    Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
                    <span className="font-bold text-slate-800">
                      {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                    </span>{" "}
                    of <span className="font-bold text-slate-800">{filteredProducts.length}</span> products
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 px-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === page
                            ? "bg-[#0f1a2e] text-white shadow"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-8 px-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create/Edit modal */}
        {(showCreateForm || !!editProduct) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-3xl rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-100 relative animate-scale-in max-h-[90vh] overflow-y-auto">
              {/* Close Icon Button */}
              <button
                type="button"
                onClick={closeProductModal}
                className="absolute top-6 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:text-black hover:bg-slate-100 transition-all shadow-sm z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c8a84b]/10 text-[#c8a84b]">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0f1a2e] tracking-tight">{editProduct ? 'Edit Product' : 'Create New Product'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editProduct ? 'Update details and save changes.' : 'Fill the form to add a product.'}
                  </p>
                </div>
              </div>

              <div>
                <form onSubmit={handleSubmit(editProduct ? onSubmitEdit : onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f1a2e] border-b border-slate-100 pb-2 mb-4">Basic Information</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        name="sport"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sport</label>
                            <select
                              {...field}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                            >
                              <option value="">Select Sport</option>
                              {sports.map(sport => (
                                <option key={sport._id} value={sport.name}>{sport.name}</option>
                              ))}
                            </select>
                            {errors.sport && <p className="text-xs text-rose-600 font-bold">{errors.sport.message}</p>}
                          </div>
                        )}
                      />

                      <Controller
                        name="equipment"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Equipment Type</label>
                            <select
                              {...field}
                              disabled={!watchedSport}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10 disabled:bg-slate-50 disabled:text-slate-400"
                            >
                              <option value="">Select Equipment</option>
                              {equipmentTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                            {errors.equipment && <p className="text-xs text-rose-600 font-bold">{errors.equipment.message}</p>}
                          </div>
                        )}
                      />

                      <Controller
                        name="brand"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand</label>
                            <select
                              {...field}
                              disabled={!watchedSport}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10 disabled:bg-slate-50 disabled:text-slate-400"
                            >
                              <option value="">Select Brand</option>
                              {brands.map(brand => (
                                <option key={brand._id} value={brand.name}>{brand.name}</option>
                              ))}
                            </select>
                            {errors.brand && <p className="text-xs text-rose-600 font-bold">{errors.brand.message}</p>}
                          </div>
                        )}
                      />

                      <Controller
                        name="model"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</label>
                            <input
                              {...field}
                              type="text"
                              placeholder="e.g., Pro, 2026, XL"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Images uploaded below will be used for this model.</p>
                            {errors.model && <p className="text-xs text-rose-600 font-bold">{errors.model.message}</p>}
                          </div>
                        )}
                      />

                      <Controller
                        name="price"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Price ({currencySymbol})</label>
                            <input
                              {...field}
                              type="number"
                              step="0.01"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                            {errors.price && <p className="text-xs text-rose-600 font-bold">{errors.price.message}</p>}
                          </div>
                        )}
                      />

                      <Controller
                        name="stock"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock</label>
                            <input
                              {...field}
                              type="number"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            {errors.stock && <p className="text-xs text-rose-600 font-bold">{errors.stock.message}</p>}
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f1a2e] border-b border-slate-100 pb-2 mb-4 mt-6">Product Images</h3>

                    {/* Feature Image */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Feature Image</label>
                      <div className="space-y-3">
                        {featureImagePreview && (
                          <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/60">
                              <Image
                                src={featureImagePreview}
                                alt="Feature image preview"
                                width={64}
                                height={64}
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=Product&background=0f1a2e&color=ffffff&size=64&font-size=0.6`;
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#0f1a2e]">Feature image uploaded</p>
                              <p className="text-[10px] text-slate-500">This will be the main product image</p>
                            </div>
                          </div>
                        )}

                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-[#0f1a2e] transition-colors bg-slate-50/50">
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
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                              <Upload className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="text-center">
                              {uploadingImage ? (
                                <p className="text-xs font-bold text-[#c8a84b] animate-pulse">Uploading...</p>
                              ) : (
                                <>
                                  <p className="text-xs font-bold text-slate-700">Upload feature image</p>
                                  <p className="text-[10px] text-slate-400">PNG, JPG, GIF up to 10MB</p>
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
                      {errors.featureImageKey && <p className="text-xs text-rose-600 font-bold">{errors.featureImageKey.message}</p>}
                    </div>

                    {/* Additional Images */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Additional Images</label>
                      <div className="space-y-3">
                        {imagePreviews.length > 0 && (
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <div className="w-full h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/60 shadow-sm">
                                  <Image
                                    src={preview}
                                    alt={`Product image ${index + 1}`}
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://ui-avatars.com/api/?name=Img${index + 1}&background=0f1a2e&color=ffffff&size=80&font-size=0.6`;
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow transition-all text-xs font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-[#0f1a2e] transition-colors bg-slate-50/50">
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
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                              <Upload className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="text-center">
                              {uploadingImage ? (
                                <p className="text-xs font-bold text-[#c8a84b] animate-pulse">Uploading...</p>
                              ) : (
                                <>
                                  <p className="text-xs font-bold text-slate-700">Add product gallery images</p>
                                  <p className="text-[10px] text-slate-400">Select multiple images (PNG, JPG, GIF up to 10MB)</p>
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
                      {errors.imageKeys && <p className="text-xs text-rose-600 font-bold">{errors.imageKeys.message}</p>}
                    </div>
                  </div>

                  {/* Dynamic Specifications */}
                  {schema && schema.fields && schema.fields.length > 0 && (
                    <div className="space-y-4 rounded-[2rem] bg-slate-50 border border-slate-100 p-6 my-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f1a2e] border-b border-slate-200 pb-2">Specifications</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {schema.fields.map((field) => renderField(field))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={closeProductModal}
                      className="flex-1 rounded-full border border-slate-200 hover:bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-all uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] py-3 text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all uppercase tracking-wider"
                    >
                      {editProduct ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create Product')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Restock modal */}
        {restockProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-100 relative animate-scale-in">
              {/* Close Icon Button */}
              <button
                type="button"
                onClick={closeRestock}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:text-black hover:bg-slate-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c8a84b]/10 text-[#c8a84b]">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0f1a2e] tracking-tight">Restock Product</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Add inventory to this product</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sport</p>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{getRefName(restockProduct.sport) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Equipment</p>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{getRefName(restockProduct.equipment) || '—'}</p>
                  </div>
                  <div className="border-t border-slate-200/50 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand</p>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{getRefName(restockProduct.brand) || '—'}</p>
                  </div>
                  <div className="border-t border-slate-200/50 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model</p>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{getModel(restockProduct) || '—'}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add stock</label>
                  <input
                    type="number"
                    min={1}
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Current stock: <span className="font-bold text-[#0f1a2e]">{restockProduct.stock ?? 0}</span>
                  </p>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={closeRestock}
                    className="flex-1 rounded-full border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isRestocking}
                    onClick={submitRestock}
                    className="flex-1 rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all uppercase tracking-wider"
                  >
                    {isRestocking ? 'Restocking…' : 'Restock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ div>
  );
}