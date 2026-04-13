import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name?: string;
  description?: string;
  sku?: string;
  sport: mongoose.Types.ObjectId;
  equipment: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  models?: string[];
  price: number;
  discount?: {
    isActive: boolean;
    type: 'percentage' | 'fixed';
    value: number;
  };
  specifications: Record<string, unknown>;
  featureImageKey?: string;
  imageKeys?: string[];
  images?: string[]; // Keep for backward compatibility
  stock?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, trim: true },
  description: { type: String, trim: true },
  sku: { type: String, trim: true },
  sport: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
  equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  models: [{ type: String, trim: true }],
  price: { type: Number, required: true },
  discount: {
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: { type: Number, min: 0 },
  },
  specifications: { type: Schema.Types.Mixed, default: {} },
  featureImageKey: { type: String },
  imageKeys: [{ type: String }],
  images: [{ type: String }], // Keep for backward compatibility
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);