'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import type { Brand, Sport } from '@/types/product';

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  logoUrl: z.string().refine((url) => {
    // Allow full URLs or relative URLs starting with /
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  }, 'Valid logo URL is required'),
  associatedSports: z.array(z.string()).min(1, 'At least one sport is required'),
  isPublished: z.boolean(),
});

type BrandFormData = z.infer<typeof brandSchema>;

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { control, handleSubmit, reset, setValue, clearErrors, watch, formState: { errors } } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      associatedSports: [],
      isPublished: false,
    },
  });

  // Fetch brands and sports
  useEffect(() => {
    fetchBrands();
    fetchSports();
  }, []);

  const fetchBrands = async () => {
    const response = await fetch('/api/brands');
    const data = await response.json();
    setBrands(data);
  };

  const fetchSports = async () => {
    const response = await fetch('/api/sports');
    const data = await response.json();
    setSports(data);
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

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header manually - let the browser set it with boundary
      });

      if (response.ok) {
        const data = await response.json();
        setValue('logoUrl', data.url);
        // Clear any previous errors
        clearErrors('logoUrl');
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

  const onSubmit = async (data: BrandFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingBrand ? `/api/brands/${editingBrand._id}` : '/api/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchBrands();
        setIsModalOpen(false);
        reset();
        setEditingBrand(null);
      } else {
        alert('Error saving brand');
      }
    } catch {
      alert('Error saving brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setValue('name', brand.name);
    setValue('logoUrl', brand.logoUrl);
    setValue('associatedSports', brand.associatedSports.map(s => s._id));
    setValue('isPublished', brand.isPublished);
    setIsModalOpen(true);
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBrands();
      } else {
        alert('Error deleting brand');
      }
    } catch {
      alert('Error deleting brand');
    }
  };

  const togglePublished = async (brand: Brand) => {
    try {
      const response = await fetch(`/api/brands/${brand._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...brand, isPublished: !brand.isPublished }),
      });

      if (response.ok) {
        await fetchBrands();
      }
    } catch {
      alert('Error updating brand status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
            <p className="text-gray-600">Manage sports brands and their associations</p>
          </div>
          <button
            onClick={() => {
              setEditingBrand(null);
              reset();
              setIsModalOpen(true);
            }}
            className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Brand
          </button>
        </div>

        {/* Brands Table */}
        <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-4 text-left font-medium text-gray-900">Logo</th>
                  <th className="pb-4 text-left font-medium text-gray-900">Name</th>
                  <th className="pb-4 text-left font-medium text-gray-900">Sports</th>
                  <th className="pb-4 text-left font-medium text-gray-900">Status</th>
                  <th className="pb-4 text-left font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          width={40}
                          height={40}
                          className="object-cover"
                          onError={(e) => {
                            // Fallback to avatar placeholder
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=6366f1&color=ffffff&size=40&font-size=0.6`;
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-4 font-medium text-gray-900">{brand.name}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {brand.associatedSports.map((sport: Sport) => (
                          <span
                            key={sport._id}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                          >
                            {sport.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => togglePublished(brand)}
                        className={`cursor-pointer inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          brand.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {brand.isPublished ? 'Published' : 'Unpublished'}
                      </button>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand._id)}
                          className="cursor-pointer rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">
                {editingBrand ? 'Edit Brand' : 'Add Brand'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Brand Name</label>
                      <input
                        {...field}
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="Enter brand name"
                      />
                      {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                    </div>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="space-y-3">
                    {/* Current Logo Preview */}
                    {watch('logoUrl') && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                          <Image
                            src={watch('logoUrl')}
                            alt="Logo preview"
                            width={48}
                            height={48}
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Brand')}&background=6366f1&color=ffffff&size=48&font-size=0.6`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current logo</p>
                          <p className="text-xs text-gray-500">Upload a new one to replace</p>
                        </div>
                      </div>
                    )}

                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      {watch('logoUrl') && !uploadingImage ? (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                            className="hidden"
                            id="logo-upload-replace"
                            disabled={uploadingImage}
                          />
                          <label
                            htmlFor="logo-upload-replace"
                            className="cursor-pointer flex items-center justify-center space-x-4"
                          >
                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                              <Image
                                src={watch('logoUrl')}
                                alt="Uploaded logo"
                                width={64}
                                height={64}
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Brand')}&background=6366f1&color=ffffff&size=64&font-size=0.6`;
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Logo uploaded successfully</p>
                              <p className="text-xs text-gray-500">Click to upload a different image</p>
                            </div>
                          </label>
                        </>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                            className="hidden"
                            id="logo-upload"
                            disabled={uploadingImage}
                          />
                          <label
                            htmlFor="logo-upload"
                            className="cursor-pointer flex flex-col items-center space-y-2"
                          >
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div className="text-center">
                              {uploadingImage ? (
                                <p className="text-sm text-blue-600">Uploading image...</p>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-gray-900">Click to upload logo</p>
                                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </>
                              )}
                            </div>
                          </label>
                        </>
                      )}
                    </div>

                    {/* Hidden URL field for form validation */}
                    <Controller
                      name="logoUrl"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                  </div>
                  {errors.logoUrl && <p className="text-sm text-red-600">{errors.logoUrl.message}</p>}
                </div>

                <Controller
                  name="associatedSports"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Associated Sports</label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {sports.map((sport) => (
                          <label key={sport._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value={sport._id}
                              checked={field.value.includes(sport._id)}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (e.target.checked) {
                                  field.onChange([...field.value, value]);
                                } else {
                                  field.onChange(field.value.filter((id) => id !== value));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{sport.name}</span>
                          </label>
                        ))}
                      </div>
                      {errors.associatedSports && <p className="text-sm text-red-600">{errors.associatedSports.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="isPublished"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm font-medium">Show on Landing Page</label>
                    </div>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                      setEditingBrand(null);
                    }}
                    className="cursor-pointer flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}