import { useState } from 'react';
import type { Address } from '@/types/address';
import { AddressBook } from '@/components/address-book';

export function ShippingAddressSection() {
  const [selected, setSelected] = useState<Address | null>(null);

  const handleSelect = (addr: Address) => {
    setSelected(addr);
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-3">Shipping Address</h3>
      <AddressBook onSelect={handleSelect} selectedId={selected?._id} />
      {selected && (
        <div className="mt-4 pt-4 border-t">
          <p className="font-medium mb-1">Selected Address:</p>
          <p className="text-sm">
            {selected.label || selected.name}<br />
            {selected.line1}{selected.line2 ? `, ${selected.line2}` : ''}<br />
            {selected.city}, {selected.region ? `${selected.region}, ` : ''}{selected.postalCode}<br />
            {selected.country}
          </p>
        </div>
      )}
    </div>
  );
}
