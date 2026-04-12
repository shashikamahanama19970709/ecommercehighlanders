export interface Sport {
  _id?: string;
  name: string;
  equipmentTypes: string[];
  imageUrl?: string;
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
  fields: FieldDefinition[];
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
  logoUrl: string;
  associatedSports: Sport[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  sport: string;
  equipment: string;
  brand: string;
  price: number;
  specifications: Record<string, unknown>; // dynamic fields
  images?: string[];
  stock?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
