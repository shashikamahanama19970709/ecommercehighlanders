import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  sport: mongoose.Types.ObjectId;
  equipment: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  price: number;
  specifications: Record<string, unknown>;
  images?: string[];
  stock?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema({
  sport: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
  equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  price: { type: Number, required: true },
  specifications: { type: Schema.Types.Mixed, default: {} },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);