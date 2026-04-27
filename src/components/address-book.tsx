import { useEffect, useState } from 'react';
import type { Address } from '@/types/address';

interface AddressBookProps {
  onSelect?: (address: Address) => void;
  selectedId?: string;
}

export function AddressBook({ onSelect, selectedId }: AddressBookProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Partial<Address>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/address');
      if (!res.ok) throw new Error('Failed to load addresses');
      setAddresses(await res.json());
    } catch (e) {
      setError('Could not load addresses');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(address?: Address) {
    setEditing(address || null);
    setForm(address ? { ...address } : {});
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      if (!res.ok) throw new Error('Save failed');
      setEditing(null);
      setForm({});
      fetchAddresses();
    } catch (e) {
      setError('Could not save address');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this address?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/address/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchAddresses();
    } catch (e) {
      setError('Could not delete address');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Shipping Addresses</h2>
        <button className="btn btn-sm" onClick={() => startEdit()}>Add New</button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-2">
          {addresses.map(addr => (
            <li key={addr._id} className={`border rounded p-3 ${selectedId === addr._id ? 'border-blue-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div onClick={() => onSelect?.(addr)} className="cursor-pointer flex-1">
                  <div className="font-medium">{addr.label || addr.name}</div>
                  <div className="text-xs text-muted-foreground">{addr.line1}, {addr.city}, {addr.postalCode}, {addr.country}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-xs" onClick={() => startEdit(addr)}>Edit</button>
                  <button className="btn btn-xs btn-danger" onClick={() => handleDelete(addr._id!)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(editing || Object.keys(form).length > 0) && (
        <form className="space-y-2 border rounded p-3" onSubmit={handleSave}>
          <div className="font-semibold">{editing ? 'Edit Address' : 'Add Address'}</div>
          <input name="label" placeholder="Label (Home, Work)" value={form.label || ''} onChange={handleChange} className="input input-sm w-full" />
          <input name="name" placeholder="Full Name" value={form.name || ''} onChange={handleChange} className="input input-sm w-full" required />
          <input name="line1" placeholder="Address Line 1" value={form.line1 || ''} onChange={handleChange} className="input input-sm w-full" required />
          <input name="line2" placeholder="Address Line 2" value={form.line2 || ''} onChange={handleChange} className="input input-sm w-full" />
          <input name="city" placeholder="City" value={form.city || ''} onChange={handleChange} className="input input-sm w-full" required />
          <input name="region" placeholder="Region/State" value={form.region || ''} onChange={handleChange} className="input input-sm w-full" />
          <input name="postalCode" placeholder="Postal Code" value={form.postalCode || ''} onChange={handleChange} className="input input-sm w-full" required />
          <input name="country" placeholder="Country" value={form.country || ''} onChange={handleChange} className="input input-sm w-full" required />
          <input name="phone" placeholder="Phone" value={form.phone || ''} onChange={handleChange} className="input input-sm w-full" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary">Save</button>
            <button type="button" className="btn btn-sm" onClick={() => { setEditing(null); setForm({}); }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
