import { useEffect, useState } from 'react';
import type { Address } from '@/types/address';
import { Plus, MapPin, Phone, Edit2, Trash2 } from 'lucide-react';

interface AddressBookProps {
  onSelect?: (address: Address) => void;
  selectedId?: string;
}

const inputCls =
  'w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/10';

const COUNTRIES = [
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Ireland',
  'Sri Lanka',
  'India',
  'Japan',
  'Singapore',
  'New Zealand',
  'Switzerland',
  'Norway',
  'Sweden',
  'Denmark',
  'Austria',
  'Belgium',
];

export function AddressBook({ onSelect, selectedId }: AddressBookProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Partial<Address>>({});
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/address');
      if (!res.ok) throw new Error('Failed to load addresses');
      const data: Address[] = await res.json();
      setAddresses(data);
      if (data.length > 0 && !selectedId) {
        const def = data.find(a => a.isDefault) || data[0];
        onSelect?.(def);
      }
    } catch (e) {
      setError('Could not load addresses');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(address?: Address) {
    setEditing(address ?? ({} as Address));
    setForm(address ? { ...address } : { country: 'United Kingdom' });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const method = editing?._id ? 'PUT' : 'POST';
      const url = editing?._id ? `/api/address/${editing._id}` : '/api/address';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Save failed');
      }
      const savedAddress = await res.json();
      setEditing(null);
      setForm({});
      
      if (savedAddress) {
        onSelect?.(savedAddress);
      }
      
      fetchAddresses();
    } catch (e: any) {
      setError(e.message || 'Could not save address');
    }
  }

  async function handleDelete(id: string) {
    const address = addresses.find(a => a._id === id);
    const label = address ? (address.label ? `"${address.label}"` : `"${address.line1}"`) : 'this address';
    
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirm Delete Address',
      message: `Are you sure you want to delete ${label}? This action cannot be undone.`,
      onConfirm: async () => {
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        setError(null);
        try {
          const res = await fetch(`/api/address/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Delete failed');
          fetchAddresses();
        } catch (e: any) {
          setError(e.message || 'Could not delete address');
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#f0f4f8] pb-3">
        <h3 className="text-sm font-bold text-[#0f1a2e]">Shipping Addresses</h3>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#1e3a5f] hover:text-[#0f1a2e] transition-colors"
          onClick={() => startEdit()}
        >
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-[#64748b]">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#1e3a5f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#dde4ee] p-6 text-center text-sm text-[#64748b]">
          No saved addresses found. Click &quot;Add New&quot; to save one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map(addr => {
            const isSelected = selectedId === addr._id;
            return (
              <div
                key={addr._id}
                onClick={() => onSelect?.(addr)}
                className={`relative flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-[#1e3a5f] bg-[#1e3a5f]/[0.02] shadow-sm'
                    : 'border-[#dde4ee] hover:border-[#c8d4e4] hover:shadow-sm bg-white'
                }`}
              >
                {/* Custom radio button */}
                <div
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected ? 'border-[#1e3a5f]' : 'border-[#dde4ee]'
                  }`}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#1e3a5f]" />
                  )}
                </div>

                {/* Address Info */}
                <div className="flex-1 space-y-1 pr-16">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#0f1a2e]">{addr.name}</span>
                    {addr.label && (
                      <span className="inline-flex items-center rounded-md bg-[#e0e7ff] px-2 py-0.5 text-[10px] font-semibold text-[#4f46e5] capitalize">
                        {addr.label}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-1.5 text-xs text-[#64748b] leading-relaxed">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 text-[#94a3b8] shrink-0" />
                    <span>
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}
                      <br />
                      {addr.city}, {addr.region ? `${addr.region}, ` : ''}{addr.postalCode}
                      <br />
                      {addr.country}
                    </span>
                  </div>

                  {addr.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                      <Phone className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                      <span>{addr.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(addr);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dde4ee] bg-white text-[#64748b] transition-all hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                    title="Edit address"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(addr._id!);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dde4ee] bg-white text-[#64748b] transition-all hover:border-red-200 hover:text-red-600"
                    title="Delete address"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(editing || Object.keys(form).length > 0) && (
        <form className="space-y-4 rounded-2xl border border-[#dde4ee] bg-[#f8fafc]/50 p-5 shadow-sm" onSubmit={handleSave}>
          <div className="text-sm font-bold text-[#0f1a2e] border-b border-[#f0f4f8] pb-2 mb-2">
            {editing?._id ? 'Edit Address' : 'Add New Address'}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Address Label <span className="text-[#94a3b8] font-normal">(e.g. Home, Work)</span>
              </label>
              <input
                name="label"
                placeholder="Home"
                value={form.label || ''}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                placeholder="Full name"
                value={form.name || ''}
                onChange={handleChange}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              name="line1"
              placeholder="Street address or P.O. Box"
              value={form.line1 || ''}
              onChange={handleChange}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Address Line 2 <span className="text-[#94a3b8] font-normal">(Optional)</span>
            </label>
            <input
              name="line2"
              placeholder="Apartment, suite, unit, building, floor, etc."
              value={form.line2 || ''}
              onChange={handleChange}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                name="city"
                placeholder="City"
                value={form.city || ''}
                onChange={handleChange}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Region / State <span className="text-[#94a3b8] font-normal">(Optional)</span>
              </label>
              <input
                name="region"
                placeholder="Region or State"
                value={form.region || ''}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Postal / ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                name="postalCode"
                placeholder="Postal or ZIP code"
                value={form.postalCode || ''}
                onChange={handleChange}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={form.country || ''}
                onChange={handleChange}
                className={inputCls}
                required
              >
                <option value="" disabled>Select country</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Phone Number <span className="text-[#94a3b8] font-normal">(Optional)</span>
            </label>
            <input
              name="phone"
              placeholder="Phone number"
              value={form.phone || ''}
              onChange={handleChange}
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#1e3a5f] hover:bg-[#1a3250] text-white text-sm font-semibold py-3 px-4 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
            >
              Save Address
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#dde4ee] bg-white hover:bg-[#f8fafc] text-[#64748b] text-sm font-semibold py-3 px-6 transition-all focus:outline-none focus:ring-2 focus:ring-[#dde4ee] focus:ring-offset-2"
              onClick={() => { setEditing(null); setForm({}); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#dde4ee] bg-white shadow-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0f1a2e]">{deleteConfirm.title}</h3>
            <p className="text-sm text-[#64748b] leading-relaxed">{deleteConfirm.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                className="cursor-pointer rounded-xl border border-[#dde4ee] bg-white px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

