import { CartItem } from "@/types/cart";
import { ShippingOption } from "@/types/shipping-option";

export function calculateTax(item: CartItem[], country: string, selectedShipping: ShippingOption): { tax: number; rate: number } {
  // UK VAT 20%, Europe 21%, International 0%
  let rate = 0;
  if (country.toLowerCase() === 'united kingdom' || country.toLowerCase() === 'uk') rate = 0.2;
  else if ([
    'austria','belgium','bulgaria','croatia','cyprus','czech republic','denmark','estonia','finland','france','germany','greece','hungary','ireland','italy','latvia','lithuania','luxembourg','malta','netherlands','poland','portugal','romania','slovakia','slovenia','spain','sweden','switzerland','norway','iceland'
  ].includes(country.toLowerCase())) rate = 0.21;
  // International: 0
  const tax = item.reduce((sum, currentItem) => sum + (currentItem.price * currentItem.quantity), 0) * rate;
  return { tax, rate };
}
