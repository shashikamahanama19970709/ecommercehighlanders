export interface Sport {
  _id?: string;
  name: string;
  equipmentTypes: string[];
  imageKey?: string;
  imageUrl?: string; // signed URL for display
}

export interface Equipment {
  _id: string;
  name: string;
  sport: Sport;
  stock: number;
  price: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  createdAt?: string;
  updatedAt?: string;
}

export interface CategorySchema {
  _id?: string;
  equipmentType: string;
  fields?: FieldDefinition[];
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[]; // for select type
  required?: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  logoKey?: string;
  logoUrl?: string; // signed URL for display
  associatedSports: { _id: string; name: string }[]; // populated
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  name?: string;
  description?: string;
  sku?: string;
  sport: { _id?: string; name?: string } | string; // populated or raw id
  equipment: { _id?: string; name?: string } | string; // populated or raw id
  brand: { _id?: string; name?: string } | string; // populated or raw id
  models?: string[];
  // Legacy single-model field that may exist on older documents.
  model?: string;
  price: number;
  discount?: {
    isActive: boolean;
    type: 'percentage' | 'fixed';
    value: number;
  };
  specifications: Record<string, unknown>; // dynamic fields
  featureImageKey?: string;
  featureImageUrl?: string;
  imageKeys?: string[];
  imageUrls?: string[];
  images?: string[];
  stock?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
