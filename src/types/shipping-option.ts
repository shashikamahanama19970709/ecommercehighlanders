export interface ShippingOption {
  id: string;
  label: string;
  description?: string;
  cost: number;
  estimatedDays: number;
  regions: string[]; // e.g. ["UK"], ["Europe"], ["International"]
  isDefault?: boolean;
}
