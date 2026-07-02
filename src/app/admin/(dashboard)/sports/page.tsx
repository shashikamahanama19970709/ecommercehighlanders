'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import Image from 'next/image';
import type { Sport } from '@/types/product';
import { NoticeBanner, type Notice } from '@/components/notice-banner';

const sportSchema = z.object({
  name: z.string().min(1, 'Sport name is required'),
  equipmentTypes: z.array(z.string().min(1, 'Equipment type cannot be empty')).min(1, 'At least one equipment type is required'),
  imageKey: z.string().optional(),
});

type SportFormData = z.infer<typeof sportSchema>;

export default function AdminSportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [notice, setNotice] = useState<Notice>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const { control, handleSubmit, reset, setValue, clearErrors, watch, getValues, formState: { errors } } = useForm<SportFormData>({
    resolver: zodResolver(sportSchema),
    defaultValues: {
      name: '',
      equipmentTypes: [''],
      imageKey: '',
    },
  });

  const equipmentTypes = watch('equipmentTypes');

  // Fetch sports
  useEffect(() => {
    fetchSports();
  }, []);

  // Filter sports
  const filteredSports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sports;
    return sports.filter(sport => sport.name.toLowerCase().includes(query));
  }, [sports, searchQuery]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Adjust pagination if the items count changes (e.g., after deletion)
  useEffect(() => {
    const totalPages = Math.ceil(filteredSports.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredSports.length, currentPage]);

  const totalPages = Math.ceil(filteredSports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSports = filteredSports.slice(startIndex, startIndex + itemsPerPage);

  const fetchSports = async () => {
    const response = await fetch('/api/sports');
    const data = await response.json();
    setSports(data);
  };

  const handleImageUpload = async (file: File) => {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Sports upload failed.' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Sports upload failed.' });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sports');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header manually - let the browser set it with boundary
      });

      if (response.ok) {
        const data = await response.json();
        setValue('imageKey', data.key);
        setPreviewUrl(data.signedUrl);
        // Clear any previous errors
        clearErrors('imageKey');
      } else {
        const error = await response.json();
        setNotice({
          type: 'error',
          message: error?.message ? `Sports upload failed: ${error.message}` : 'Sports upload failed.',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotice({ type: 'error', message: 'Sports upload failed.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: SportFormData) => {
    setIsSubmitting(true);
    try {
      const submitData: {
        name: string;
        equipmentTypes: string[];
        imageKey?: string;
      } = {
        name: data.name,
        equipmentTypes: data.equipmentTypes.filter(type => type.trim() !== ''), // Filter out empty types
      };
      if (data.imageKey && data.imageKey.trim()) {
        submitData.imageKey = data.imageKey;
      }

      const url = editingSport ? `/api/sports/${editingSport._id}` : '/api/sports';
      const method = editingSport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        await fetchSports();
        setNotice({
          type: 'success',
          message: editingSport ? 'Sports updated successfully.' : 'Sports created successfully.',
        });
        setIsModalOpen(false);
        reset({
          name: '',
          equipmentTypes: [''],
          imageKey: '',
        });
        setEditingSport(null);
        setPreviewUrl('');
      } else {
        setNotice({ type: 'error', message: editingSport ? 'Sports update failed.' : 'Sports create failed.' });
      }
    } catch {
      setNotice({ type: 'error', message: editingSport ? 'Sports update failed.' : 'Sports create failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport);
    setValue('name', sport.name);
    setValue('equipmentTypes', sport.equipmentTypes?.length ? sport.equipmentTypes : ['']);
    setValue('imageKey', sport.imageKey || '');
    setPreviewUrl(sport.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (sportId: string) => {
    const sport = sports.find(s => s._id === sportId);
    const label = sport ? `"${sport.name}"` : 'this sport';

    setDeleteConfirm({
      isOpen: true,
      title: 'Confirm Delete Sport',
      message: `Are you sure you want to delete the sport ${label}? This will permanently remove the sport and its equipment types.`,
      onConfirm: async () => {
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/sports/${sportId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            await fetchSports();
            setNotice({ type: 'success', message: 'Sport deleted successfully.' });
          } else {
            setNotice({ type: 'error', message: 'Sport delete failed.' });
          }
        } catch {
          setNotice({ type: 'error', message: 'Sport delete failed.' });
        }
      }
    });
  };

  const addEquipmentType = () => {
    const currentTypes = getValues('equipmentTypes') || [];
    setValue('equipmentTypes', [...currentTypes, ''], { shouldDirty: true, shouldTouch: true });
  };

  const removeEquipmentType = (index: number) => {
    const currentTypes = getValues('equipmentTypes') || [];
    if (currentTypes.length > 1) {
      setValue('equipmentTypes', currentTypes.filter((_: string, i: number) => i !== index), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const updateEquipmentType = (index: number, value: string) => {
    const currentTypes = getValues('equipmentTypes') || [];
    const newTypes = [...currentTypes];
    newTypes[index] = value;
    setValue('equipmentTypes', newTypes, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sports Management</h1>
            <p className="text-gray-600">Manage sports categories and equipment types</p>
          </div>
          <button
            onClick={() => {
              setEditingSport(null);
              reset({
                name: '',
                equipmentTypes: [''],
                imageKey: '',
              });
              setPreviewUrl('');
              setIsModalOpen(true);
            }}
            className="cursor-pointer flex items-center gap-2 rounded-full bg-[#0f1a2e] hover:bg-[#c8a84b] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            Add Sport
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
              placeholder="Search sports by name..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10 transition-all font-semibold"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Sports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedSports.map((sport) => (
            <div
              key={sport._id}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Image Section */}
              <div className="relative h-44 w-full bg-slate-50 overflow-hidden">
                <Image
                  src={sport.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(sport.name)}&background=0f1a2e&color=ffffff&size=200`}
                  alt={sport.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sport.name)}&background=0f1a2e&color=ffffff&size=200`;
                  }}
                />
                
                {/* Floating Edit/Delete Actions (top right) */}
                <div className="absolute right-3 top-3 flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-sm border border-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEdit(sport)}
                    className="cursor-pointer p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Sport"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => sport._id && handleDelete(sport._id)}
                    className="cursor-pointer p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Sport"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-base font-bold text-[#0f1a2e] mb-1.5 tracking-tight">{sport.name}</h3>
                
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {sport.equipmentTypes.length} equipment type{sport.equipmentTypes.length !== 1 ? 's' : ''}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {sport.equipmentTypes.slice(0, 3).map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {type}
                      </span>
                    ))}
                    {sport.equipmentTypes.length > 3 && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        +{sport.equipmentTypes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredSports.length === 0 ? 0 : startIndex + 1}</span> to{" "}
              <span className="font-bold text-slate-800">
                {Math.min(startIndex + itemsPerPage, filteredSports.length)}
              </span>{" "}
              of <span className="font-bold text-slate-800">{filteredSports.length}</span> sports
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 px-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
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
                className="inline-flex h-8 px-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-100 relative animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[#0f1a2e] tracking-tight">
                  {editingSport ? 'Edit Sport' : 'Add New Sport'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset({
                      name: '',
                      equipmentTypes: [''],
                      imageKey: '',
                    });
                    setEditingSport(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:text-black hover:bg-slate-100 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sport Name</label>
                      <input
                        {...field}
                        type="text"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
                        placeholder="e.g., Football, Tennis"
                      />
                      {errors.name && <p className="text-xs text-rose-600 font-bold">{errors.name.message}</p>}
                    </div>
                  )}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sport Image</label>
                  <div className="space-y-3">
                    {/* Current Image Preview */}
                    {previewUrl && (
                      <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-200/60">
                          <Image
                            src={previewUrl}
                            alt="Sport image preview"
                            width={48}
                            height={48}
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Sport')}&background=0f1a2e&color=ffffff&size=48&font-size=0.6`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f1a2e]">Current image</p>
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
                            id="sport-image-upload-replace"
                            disabled={uploadingImage}
                          />
                          <label
                            htmlFor="sport-image-upload-replace"
                            className="cursor-pointer flex items-center justify-center space-x-4"
                          >
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/60">
                              <Image
                                src={previewUrl}
                                alt="Uploaded sport image"
                                width={64}
                                height={64}
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Sport')}&background=0f1a2e&color=ffffff&size=64&font-size=0.6`;
                                }}
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-bold text-emerald-700">Image Uploaded</p>
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
                            id="sport-image-upload"
                            disabled={uploadingImage}
                          />
                          <label
                            htmlFor="sport-image-upload"
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
                                  <p className="text-xs font-bold text-slate-700">Upload sport image</p>
                                  <p className="text-[10px] text-slate-400">PNG, JPG up to 10MB</p>
                                </>
                              )}
                            </div>
                          </label>
                        </>
                      )}
                    </div>

                    <Controller
                      name="imageKey"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                  </div>
                  {errors.imageKey && <p className="text-xs text-rose-600 font-bold">{errors.imageKey.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Equipment Types</label>
                    <button
                      type="button"
                      onClick={addEquipmentType}
                      className="cursor-pointer text-xs font-bold text-[#0f1a2e] hover:text-[#c8a84b]"
                    >
                      + Add Type
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {(equipmentTypes || [''])?.map((type, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={type}
                          onChange={(e) => updateEquipmentType(index, e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-[#0f1a2e]"
                          placeholder="e.g., Ball, Bat, Shoes"
                        />
                        <button
                          type="button"
                          onClick={() => removeEquipmentType(index)}
                          className="cursor-pointer rounded-xl p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {Array.isArray(errors.equipmentTypes) ? (
                    <div className="space-y-1">
                      {errors.equipmentTypes.map((err, idx) => {
                        const message = (err as { message?: string } | undefined)?.message;
                        if (!message) return null;
                        return (
                          <p key={idx} className="text-xs text-rose-600 font-bold">
                            {message}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    errors.equipmentTypes && (
                      <p className="text-xs text-rose-600 font-bold">{(errors.equipmentTypes as unknown as { message?: string })?.message}</p>
                    )
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset({
                        name: '',
                        equipmentTypes: [''],
                        imageKey: '',
                      });
                      setEditingSport(null);
                      setPreviewUrl('');
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
                    {isSubmitting ? 'Saving...' : 'Save Sport'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-lg p-6 space-y-4">
              <h3 className="text-base font-bold text-foreground">{deleteConfirm.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{deleteConfirm.message}</p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                  className="cursor-pointer rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-accent font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteConfirm.onConfirm}
                  className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}