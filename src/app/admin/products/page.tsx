'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import type { Sport, CategorySchema, FieldDefinition, Brand } from '@/types/product';

const baseSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  equipment: z.string().min(1, 'Equipment is required'),
  brand: z.string().min(1, 'Brand is required'),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [featureImagePreview, setFeatureImagePreview] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const { control, handleSubmit, watch, reset, setValue, clearErrors, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      sport: '',
      equipment: '',
      brand: '',
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
      } = {
        ...data,
      };

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
              {schema && schema.fields && schema.fields.length > 0 && (
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