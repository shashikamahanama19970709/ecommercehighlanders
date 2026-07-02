import type { ShippingOption } from '@/types/shipping-option';

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'uk-standard',
    label: 'UK Standard Delivery',
    description: '2-4 business days',
    estimate: '2-4 business days',
    cost: 4.99,
    estimatedDays: 2,
    regions: ['UK'],
    isDefault: true,
  },
  {
    id: 'uk-express',
    label: 'UK Express Delivery',
    description: 'Next business day',
    estimate: 'Next business day',
    cost: 8.99,
    estimatedDays: 1,
    regions: ['UK'],
  },
  {
    id: 'europe',
    label: 'Europe Delivery',
    description: '3-7 business days',
    estimate: '3-7 business days',
    cost: 14.99,
    estimatedDays: 5,
    regions: ['Europe'],
  },
  {
    id: 'international',
    label: 'International Delivery',
    description: '5-14 business days',
    estimate: '5-14 business days',
    cost: 24.99,
    estimatedDays: 10,
    regions: ['International'],
  },
];

export function getShippingOptionsForCountry(country: string): ShippingOption[] {
  if (!country) return SHIPPING_OPTIONS;
  if (country.toLowerCase() === 'united kingdom' || country.toLowerCase() === 'uk') {
    return SHIPPING_OPTIONS.filter(opt => opt.regions.includes('UK'));
  }
  if ([
    'austria','belgium','bulgaria','croatia','cyprus','czech republic','denmark','estonia','finland','france','germany','greece','hungary','ireland','italy','latvia','lithuania','luxembourg','malta','netherlands','poland','portugal','romania','slovakia','slovenia','spain','sweden','switzerland','norway','iceland'
  ].includes(country.toLowerCase())) {
    return SHIPPING_OPTIONS.filter(opt => opt.regions.includes('Europe'));
  }
  return SHIPPING_OPTIONS.filter(opt => opt.regions.includes('International'));
}

export function getShippingOptionsForList(options: ShippingOption[], country: string): ShippingOption[] {
  console.log('[getShippingOptionsForList] Filtering options for country:', country);
  console.log('[getShippingOptionsForList] Total options in database:', options.map(o => ({ id: o.id, regions: o.regions, isActive: o.isActive })));
  if (!country) return options;
  const c = country.toLowerCase();
  
  let result: ShippingOption[] = [];
  if (c === 'united kingdom' || c === 'uk') {
    result = options.filter(opt => opt.regions.map(r => r.toUpperCase()).includes('UK'));
    console.log('[getShippingOptionsForList] Country mapped to UK. Matching options:', result.map(o => o.id));
    return result;
  }
  
  const europeanCountries = [
    'austria','belgium','bulgaria','croatia','cyprus','czech republic','denmark','estonia','finland','france','germany','greece','hungary','ireland','italy','latvia','lithuania','luxembourg','malta','netherlands','poland','portugal','romania','slovakia','slovenia','spain','sweden','switzerland','norway','iceland'
  ];
  if (europeanCountries.includes(c)) {
    result = options.filter(opt => opt.regions.map(r => r.toUpperCase()).includes('EUROPE'));
    console.log('[getShippingOptionsForList] Country mapped to EUROPE. Matching options:', result.map(o => o.id));
    return result;
  }
  
  result = options.filter(opt => opt.regions.map(r => r.toUpperCase()).includes('INTERNATIONAL'));
  console.log('[getShippingOptionsForList] Country mapped to INTERNATIONAL. Matching options:', result.map(o => o.id));
  return result;
}

