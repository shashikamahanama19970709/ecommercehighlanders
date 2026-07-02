import { CartItem } from "@/types/cart";
import { ShippingOption } from "@/types/shipping-option";

export interface TaxRate {
  id: string;
  label: string;
  rate: number; // percentage (e.g. 20)
  country: string; // e.g. "United Kingdom", "Europe", "International"
  isActive: boolean;
}

export function calculateTax(item: CartItem[], country: string, selectedShipping: ShippingOption): { tax: number; rate: number } {
  // UK VAT 20%, Europe 21%, International 0%
  let rate = 0;
  if (country.toLowerCase() === 'united kingdom' || country.toLowerCase() === 'uk') rate = 0.2;
  else if ([
    'austria','belgium','bulgaria','croatia','cyprus','czech republic','denmark','estonia','finland','france','germany','greece','hungary','ireland','italy','latvia','lithuania','luxembourg','malta','netherlands','poland','portugal','romania','slovakia','slovenia','spain','sweden','switzerland','norway','iceland'
  ].includes(country.toLowerCase())) rate = 0.21;
  // International: 0
  const tax = item.reduce((sum, currentItem) => sum + ((currentItem.product?.price ?? currentItem.price) * currentItem.quantity), 0) * rate;
  return { tax, rate };
}

export function calculateDynamicTax(
  items: CartItem[],
  country: string,
  taxRates: TaxRate[]
): { tax: number; rate: number } {
  const c = country.toLowerCase();
  
  // 1. Search for an exact active tax rate matching country name
  let matchedRate = taxRates.find(
    (r) => r.isActive && r.country.toLowerCase() === c
  );
  
  // 2. Fallback to UK check
  if (!matchedRate && (c === 'united kingdom' || c === 'uk')) {
    matchedRate = taxRates.find(
      (r) => r.isActive && (r.country.toLowerCase() === 'united kingdom' || r.country.toLowerCase() === 'uk')
    );
  }
  
  // 3. Fallback to Europe check
  const europeanCountries = [
    'austria','belgium','bulgaria','croatia','cyprus','czech republic','denmark','estonia','finland','france','germany','greece','hungary','ireland','italy','latvia','lithuania','luxembourg','malta','netherlands','poland','portugal','romania','slovakia','slovenia','spain','sweden','switzerland','norway','iceland'
  ];
  if (!matchedRate && europeanCountries.includes(c)) {
    matchedRate = taxRates.find(
      (r) => r.isActive && r.country.toLowerCase() === 'europe'
    );
  }
  
  // 4. Fallback to International check
  if (!matchedRate) {
    matchedRate = taxRates.find(
      (r) => r.isActive && r.country.toLowerCase() === 'international'
    );
  }
  
  const percentage = matchedRate ? matchedRate.rate : 0;
  const rate = percentage / 100;
  const tax = items.reduce((sum, item) => sum + ((item.product?.price ?? item.price) * item.quantity), 0) * rate;
  return { tax, rate };
}


