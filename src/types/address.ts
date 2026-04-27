export interface Address {
  _id?: string;
  userId?: string;
  label?: string; // e.g. "Home", "Work"
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
