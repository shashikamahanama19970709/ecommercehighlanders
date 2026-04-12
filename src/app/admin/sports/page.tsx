'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trophy, Plus, Edit, Trash2, X } from 'lucide-react';
import type { Sport } from '@/types/product';

const sportSchema = z.object({
  name: z.string().min(1, 'Sport name is required'),
  equipmentTypes: z.array(z.string()).min(1, 'At least one equipment type is required'),
  imageUrl: z.string().optional(),
});

type SportFormData = z.infer<typeof sportSchema>;

export default function AdminSportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<SportFormData>({
    resolver: zodResolver(sportSchema),
    defaultValues: {
      name: '',
      equipmentTypes: [],
      imageUrl: '',
    },
  });

  // Fetch sports
  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    const response = await fetch('/api/sports');
    const data = await response.json();
    setSports(data);
  };

  const onSubmit = async (data: SportFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingSport ? `/api/sports/${editingSport._id}` : '/api/sports';
      const method = editingSport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchSports();
        setIsModalOpen(false);
        reset();
        setEditingSport(null);
      } else {
        alert('Error saving sport');
      }
    } catch {
      alert('Error saving sport');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport);
    setValue('name', sport.name);
    setValue('equipmentTypes', sport.equipmentTypes);
    setValue('imageUrl', sport.imageUrl || '');
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
      } else {
        alert('Error deleting sport');
      }
    } catch {
      alert('Error deleting sport');
    }
  };

  const addEquipmentType = () => {
    const currentTypes = control._formValues.equipmentTypes || [];
    setValue('equipmentTypes', [...currentTypes, '']);
  };

  const removeEquipmentType = (index: number) => {
    const currentTypes = control._formValues.equipmentTypes || [];
    setValue('equipmentTypes', currentTypes.filter((_, i) => i !== index));
  };

  const updateEquipmentType = (index: number, value: string) => {
    const currentTypes = control._formValues.equipmentTypes || [];
    const newTypes = [...currentTypes];
    newTypes[index] = value;
    setValue('equipmentTypes', newTypes);
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
              reset();
              setIsModalOpen(true);
            }}
            className="cursor-pointer flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Sport
          </button>
        </div>

        {/* Sports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sports.map((sport) => (
            <div
              key={sport._id}
              className="group relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(sport)}
                    className="cursor-pointer p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sport._id)}
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
                    reset();
                    setEditingSport(null);
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

                <Controller
                  name="imageUrl"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sport Image URL (Optional)</label>
                      <input
                        {...field}
                        type="url"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="https://example.com/sport-image.jpg"
                      />
                      {errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}
                    </div>
                  )}
                />

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
                    {control._formValues.equipmentTypes?.map((type, index) => (
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

                  {errors.equipmentTypes && <p className="text-sm text-red-600">{errors.equipmentTypes.message}</p>}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                      setEditingSport(null);
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