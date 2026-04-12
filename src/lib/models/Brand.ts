import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  logoKey?: string;
  logoUrl?: string; // For backward compatibility
  associatedSports: mongoose.Types.ObjectId[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  logoKey: { type: String },
  logoUrl: { type: String }, // For backward compatibility
  associatedSports: [{ type: Schema.Types.ObjectId, ref: 'Sport' }],
  isPublished: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export default mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);