import mongoose, { Schema, Document } from 'mongoose';

export interface IEquipment extends Document {
  name: string;
  sport: mongoose.Types.ObjectId;
  category: string; // e.g., "Ball", "Bat", "Shoes", etc.
  description?: string;
  totalStock: number;
  availableStock: number;
  status: 'active' | 'discontinued' | 'out_of_stock';
  specifications?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema: Schema = new Schema({
  name: { type: String, required: true },
  sport: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
  category: { type: String, required: true },
  description: { type: String },
  totalStock: { type: Number, required: true, default: 0 },
  availableStock: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['active', 'discontinued', 'out_of_stock'],
    default: 'active'
  },
  specifications: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

// Compound index to ensure unique equipment per sport
EquipmentSchema.index({ name: 1, sport: 1 }, { unique: true });

export default mongoose.models.Equipment || mongoose.model<IEquipment>('Equipment', EquipmentSchema);