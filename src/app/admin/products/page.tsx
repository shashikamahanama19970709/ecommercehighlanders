'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Sport, CategorySchema, FieldDefinition, Brand } from '@/types/product';

const baseSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  equipment: z.string().min(1, 'Equipment is required'),
  brand: z.string().min(1, 'Brand is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().min(0, 'Stock must be non-negative').optional(),
});

type FormData = z.infer<typeof baseSchema> & {
  specifications: Record<string, unknown>;
};

export default function AdminProductsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [schema, setSchema] = useState<CategorySchema | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      sport: '',
      equipment: '',
      brand: '',
      price: 0,
      stock: 0,
      specifications: {},
    },
  });

  const watchedSport = watch('sport');
  const watchedEquipment = watch('equipment');

  // Fetch sports on mount
  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    const response = await fetch('/api/sports');
    const data = await response.json();
    setSports(data);
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
      const sport = sports.find(s => s.name === watchedSport);
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
        .then(setSchema);
    }
  }, [watchedEquipment]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Product created successfully!');
        reset();
        setSchema(null);
        setBrands([]);
      } else {
        alert('Error creating product');
      }
    } catch {
      alert('Error creating product');
    } finally {
      setIsSubmitting(false);
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
            rules={{ required: field.required, min: 0 }}
            render={({ field: controllerField }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                <input
                  {...controllerField}
                  type="number"
                  step="0.01"
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
          <p className="text-muted-foreground">Add new products to your inventory</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-xl bg-background/80 backdrop-blur-sm p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Add New Product</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Brand</label>
                      <input
                        {...field}
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="Enter brand name"
                      />
                      {errors.brand && <p className="text-sm text-red-600">{errors.brand.message}</p>}
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

              {/* Dynamic Specifications */}
              {schema && schema.fields.length > 0 && (
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
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Form Preview</h2>
            <div className="space-y-4 text-sm">
              <div><strong>Sport:</strong> {watchedSport || 'Not selected'}</div>
              <div><strong>Equipment:</strong> {watchedEquipment || 'Not selected'}</div>
              <div><strong>Brand:</strong> {watch('brand') || 'Not selected'}</div>
              {schema && (
                <div>
                  <strong>Dynamic Fields:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {schema.fields.map(field => (
                      <li key={field.name}>{field.label} ({field.type})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}