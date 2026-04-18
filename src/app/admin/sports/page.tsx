'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, X } from 'lucide-react';
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
    if (!confirm('Are you sure you want to delete this sport?')) return;

    try {
      const response = await fetch(`/api/sports/${sportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSports();
        setNotice({ type: 'success', message: 'Sports deleted successfully.' });
      } else {
        setNotice({ type: 'error', message: 'Sports delete failed.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Sports delete failed.' });
    }
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
            className="cursor-pointer flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Sport
          </button>
        </div>

        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        {/* Sports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sports.map((sport) => (
            <div
              key={sport._id}
              className="group relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                  <Image
                    src={sport.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(sport.name)}&background=6366f1&color=ffffff&size=48&font-size=0.6`}
                    alt={sport.name}
                    width={48}
                    height={48}
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to avatar placeholder
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sport.name)}&background=6366f1&color=ffffff&size=48&font-size=0.6`;
                    }}
                  />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(sport)}
                    className="cursor-pointer p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => sport._id && handleDelete(sport._id)}
                    className="cursor-pointer p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{sport.name}</h3>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {sport.equipmentTypes.length} equipment type{sport.equipmentTypes.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  {sport.equipmentTypes.slice(0, 3).map((type, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {type}
                    </span>
                  ))}
                  {sport.equipmentTypes.length > 3 && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      +{sport.equipmentTypes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingSport ? 'Edit Sport' : 'Add Sport'}
                </h2>
                <button
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
                  className="cursor-pointer rounded-md p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sport Name</label>
                      <input
                        {...field}
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="Enter sport name"
                      />
                      {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                    </div>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sport Image</label>
                  <div className="space-y-3">
                    {/* Current Image Preview */}
                    {previewUrl && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                          <Image
                            src={previewUrl}
                            alt="Sport image preview"
                            width={48}
                            height={48}
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Sport')}&background=6366f1&color=ffffff&size=48&font-size=0.6`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current image</p>
                          <p className="text-xs text-gray-500">Upload a new one to replace</p>
                        </div>
                      </div>
                    )}

                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
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
                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                              <Image
                                src={previewUrl}
                                alt="Uploaded sport image"
                                width={64}
                                height={64}
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch('name') || 'Sport')}&background=6366f1&color=ffffff&size=64&font-size=0.6`;
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Image uploaded successfully</p>
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
                            id="sport-image-upload"
                            disabled={uploadingImage}
                          />
                          <label
                            htmlFor="sport-image-upload"
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
                                  <p className="text-sm font-medium text-gray-900">Click to upload sport image</p>
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
                      name="imageKey"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                  </div>
                  {errors.imageKey && <p className="text-sm text-red-600">{errors.imageKey.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Equipment Types</label>
                    <button
                      type="button"
                      onClick={addEquipmentType}
                      className="cursor-pointer text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Type
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(equipmentTypes || [''])?.map((type, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={type}
                          onChange={(e) => updateEquipmentType(index, e.target.value)}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., Ball, Bat, Shoes"
                        />
                        <button
                          type="button"
                          onClick={() => removeEquipmentType(index)}
                          className="cursor-pointer rounded-md p-2 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                          <p key={idx} className="text-sm text-red-600">
                            {message}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    errors.equipmentTypes && (
                      <p className="text-sm text-red-600">{(errors.equipmentTypes as unknown as { message?: string })?.message}</p>
                    )
                  )}
                </div>

                <div className="flex gap-3 pt-4">
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