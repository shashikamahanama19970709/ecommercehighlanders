import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  logoUrl: string;
  associatedSports: mongoose.Types.ObjectId[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  logoUrl: { type: String, required: true },
  associatedSports: [{ type: Schema.Types.ObjectId, ref: 'Sport', required: true }],
  isPublished: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export default mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);