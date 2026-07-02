'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import type { Brand, Sport } from '@/types/product';
import { NoticeBanner, type Notice } from '@/components/notice-banner';
import { X, Search } from 'lucide-react';

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  logoKey: z.string(),
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
  const [uploadingImage, setUploadingImage] = useState(false); const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const { control, handleSubmit, reset, setValue, clearErrors, watch, formState: { errors } } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      logoKey: '',
      associatedSports: [],
      isPublished: false,
    },
  });

  // Pagination State
  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  // Fetch brands and sports
  useEffect(() => {
    fetchBrands();
    fetchSports();
  }, []);

  // Filter brands
  const filteredBrands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return brands;
    return brands.filter(brand => brand.name.toLowerCase().includes(query));
  }, [brands, searchQuery]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Adjust pagination if the items count changes (e.g., after deletion)
  useEffect(() => {
    const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredBrands.length, currentPage]);

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBrands = filteredBrands.slice(startIndex, startIndex + itemsPerPage);

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
      setNotice({ type: 'error', message: 'Brands upload failed.' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Brands upload failed.' });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'brands');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header manually - let the browser set it with boundary
      });

      if (response.ok) {
        const data = await response.json();
        setValue('logoKey', data.key);
        setPreviewUrl(data.signedUrl);
        // Clear any previous errors
        clearErrors('logoKey');
      } else {
        const error = await response.json();
        setNotice({
          type: 'error',
          message: error?.message ? `Brands upload failed: ${error.message}` : 'Brands upload failed.',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotice({ type: 'error', message: 'Brands upload failed.' });
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
        setNotice({
          type: 'success',
          message: editingBrand ? 'Brands updated successfully.' : 'Brands created successfully.',
        });
        setIsModalOpen(false);
        reset();
        setPreviewUrl(null);
        setEditingBrand(null);
      } else {
        setNotice({ type: 'error', message: editingBrand ? 'Brands update failed.' : 'Brands create failed.' });
      }
    } catch {
      setNotice({ type: 'error', message: editingBrand ? 'Brands update failed.' : 'Brands create failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setValue('name', brand.name);
    setValue('logoKey', brand.logoKey || '');
    setValue('associatedSports', brand.associatedSports.map(s => s._id));
    setValue('isPublished', brand.isPublished);
    setPreviewUrl(brand.logoUrl || null);
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
        setNotice({ type: 'success', message: 'Brands deleted successfully.' });
      } else {
        setNotice({ type: 'error', message: 'Brands delete failed.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Brands delete failed.' });
    }
  };

  const togglePublished = async (brand: Brand) => {
    try {
      const response = await fetch(`/api/brands/${brand._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !brand.isPublished }),
      });

      if (response.ok) {
        await fetchBrands();
        setNotice({ type: 'success', message: 'Brands updated successfully.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Brands update failed.' });
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
              setPreviewUrl(null);
              setIsModalOpen(true);
            }}
            className="cursor-pointer rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
          >
            Add Brand
          </button>
        </div>

        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        {/* Search Bar */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands by name..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10 transition-all font-semibold"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Brands Table */}
        <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-slate-100">
              <thead>
                <tr>
                  <th scope="col" className="pb-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Logo</th>
                  <th scope="col" className="pb-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Name</th>
                  <th scope="col" className="pb-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Sports</th>
                  <th scope="col" className="pb-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                  <th scope="col" className="pb-4 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedBrands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 whitespace-nowrap">
                      <div className="w-20 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-1 shadow-sm">
                        {brand.logoUrl ? (
                          <Image
                            src={brand.logoUrl}
                            alt={brand.name}
                            width={80}
                            height={48}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=0f1a2e&color=ffffff&size=80&font-size=0.6`;
                            }}
                          />
                        ) : (
                          <div className="text-xs text-slate-400 font-bold">No logo</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 whitespace-nowrap font-bold text-slate-800">{brand.name}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {brand.associatedSports.map((sport) => (
                          <span
                            key={sport._id}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200/40"
                          >
                            {sport.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePublished(brand)}
                        className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${brand.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${brand.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {brand.isPublished ? 'Published' : 'Unpublished'}
                      </button>
                    </td>
                    <td className="py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="cursor-pointer rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand._id)}
                          className="cursor-pointer rounded-full bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
              <p className="text-xs text-slate-500 font-semibold">
                Showing <span className="font-bold text-slate-800">{filteredBrands.length === 0 ? 0 : startIndex + 1}</span> to{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(startIndex + itemsPerPage, filteredBrands.length)}
                </span>{" "}
                of <span className="font-bold text-slate-800">{filteredBrands.length}</span> brands
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-100 relative animate-scale-in">
              {/* Close icon */}
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setPreviewUrl(null);
                  setEditingBrand(null);
                }}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:text-black hover:bg-slate-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="mb-6 text-xl font-black text-[#0f1a2e] tracking-tight">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand Name</label>
                      <input
                        {...field}
                        type="text"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                        placeholder="e.g., Nike, Adidas"
                      />
                      {errors.name && <p className="text-xs text-rose-600 font-bold">{errors.name.message}</p>}
                    </div>
                  )}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Logo</label>
                  <div className="space-y-3">
                    {/* Current Logo Preview */}
                    {previewUrl && (
                      <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-200/60">
                          <Image
                            src={previewUrl}
                            alt="Logo preview"
                            width={48}
                            height={48}
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Brand')}&background=0f1a2e&color=ffffff&size=48&font-size=0.6`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f1a2e]">Current logo</p>
                          <p className="text-[10px] text-slate-500">Upload a new image to replace</p>
                        </div>
                      </div>
                    )}

                    {/* File Upload Container */}
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-[#0f1a2e] transition-colors bg-slate-50/50">
                      {previewUrl && !uploadingImage ? (
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
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/60">
                              <Image
                                src={previewUrl}
                                alt="Uploaded logo"
                                width={64}
                                height={64}
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Brand')}&background=0f1a2e&color=ffffff&size=64&font-size=0.6`;
                                }}
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-bold text-emerald-700">Logo Uploaded</p>
                              <p className="text-[10px] text-slate-500">Click to upload a different image</p>
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
                            className="cursor-pointer flex flex-col items-center space-y-2 py-2"
                          >
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div className="text-center">
                              {uploadingImage ? (
                                <p className="text-xs font-bold text-[#c8a84b] animate-pulse">Uploading...</p>
                              ) : (
                                <>
                                  <p className="text-xs font-bold text-slate-700">Upload logo image</p>
                                  <p className="text-[10px] text-slate-400">PNG, JPG up to 10MB</p>
                                </>
                              )}
                            </div>
                          </label>
                        </>
                      )}
                    </div>

                    <Controller
                      name="logoKey"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                  </div>
                  {errors.logoKey && <p className="text-xs text-rose-600 font-bold">{errors.logoKey.message}</p>}
                </div>

                <Controller
                  name="associatedSports"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Associated Sports</label>
                      <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
                        {sports.map((sport) => (
                          <label key={sport._id} className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              value={sport._id}
                              checked={sport._id ? field.value.includes(sport._id) : false}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (e.target.checked) {
                                  field.onChange([...field.value, value]);
                                } else {
                                  field.onChange(field.value.filter((id) => id !== value));
                                }
                              }}
                              className="rounded border-slate-300 text-[#0f1a2e] focus:ring-[#0f1a2e] h-4 w-4"
                            />
                            <span className="text-xs font-semibold text-slate-700">{sport.name}</span>
                          </label>
                        ))}
                      </div>
                      {errors.associatedSports && <p className="text-xs text-rose-600 font-bold">{errors.associatedSports.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="isPublished"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-slate-300 text-[#0f1a2e] focus:ring-[#0f1a2e] h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Publish on landing page</span>
                    </label>
                  )}
                />

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                      setPreviewUrl(null);
                      setEditingBrand(null);
                    }}
                    className="flex-1 rounded-full border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all uppercase tracking-wider"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Brand'}
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