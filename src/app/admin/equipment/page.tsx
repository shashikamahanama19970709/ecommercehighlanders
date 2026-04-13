'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Plus, Edit, Trash2, X, Search, Filter } from 'lucide-react';
import type { Equipment } from '@/types/product';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  sport: z.string().min(1, 'Sport is required'),
  stock: z.number().min(0, 'Stock must be 0 or greater'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  status: z.enum(['available', 'out_of_stock', 'discontinued']),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export default function AdminEquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sports, setSports] = useState<{ _id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      sport: '',
      stock: 0,
      price: 0,
      status: 'available',
    },
  });

  // Fetch equipment and sports
  useEffect(() => {
    fetchEquipment();
    fetchSports();
  }, []);

  const fetchEquipment = async () => {
    const response = await fetch('/api/equipment');
    const data = await response.json();
    setEquipment(data);
  };

  const fetchSports = async () => {
    const response = await fetch('/api/sports');
    const data = await response.json();
    setSports(data);
  };

  const onSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingEquipment ? `/api/equipment/${editingEquipment._id}` : '/api/equipment';
      const method = editingEquipment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchEquipment();
        setIsModalOpen(false);
        reset();
        setEditingEquipment(null);
      } else {
        alert('Error saving equipment');
      }
    } catch {
      alert('Error saving equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setValue('name', item.name);
    setValue('sport', item.sport?._id ?? '');
    setValue('stock', item.stock);
    setValue('price', item.price);
    setValue('status', item.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (equipmentId: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    try {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEquipment();
      } else {
        alert('Error deleting equipment');
      }
    } catch {
      alert('Error deleting equipment');
    }
  };

  // Filter equipment based on search and status
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sport.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
            <p className="text-gray-600">Manage equipment inventory and stock levels</p>
          </div>
          <button
            onClick={() => {
              setEditingEquipment(null);
              reset();
              setIsModalOpen(true);
            }}
            className="cursor-pointer flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment or sport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Equipment Table */}
        <div className="overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Equipment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sport</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEquipment.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                          <Wrench className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.sport.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.stock > 10 ? 'bg-green-100 text-green-800' :
                        item.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="cursor-pointer p-1 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="cursor-pointer p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEquipment.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first equipment item.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setEditingEquipment(null);
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
                      <label className="text-sm font-medium">Equipment Name</label>
                      <input
                        {...field}
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                        placeholder="Enter equipment name"
                      />
                      {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="sport"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sport</label>
                      <select
                        {...field}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select a sport</option>
                        {sports.map((sport) => (
                          <option key={sport._id} value={sport._id}>
                            {sport.name}
                          </option>
                        ))}
                      </select>
                      {errors.sport && <p className="text-sm text-red-600">{errors.sport.message}</p>}
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="stock"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Stock</label>
                        <input
                          {...field}
                          type="number"
                          min="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                        />
                        {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
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
                          min="0"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                        />
                        {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        {...field}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                      >
                        <option value="available">Available</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                      {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
                    </div>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                      setEditingEquipment(null);
                    }}
                    className="cursor-pointer flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
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