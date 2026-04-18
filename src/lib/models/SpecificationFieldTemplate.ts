import mongoose, { Schema, Document } from 'mongoose';

export type SpecificationFieldType = 'text' | 'number' | 'weight' | 'color' | 'select';

export interface ISpecificationFieldTemplate extends Document {
  name: string;
  label: string;
  type: SpecificationFieldType;
  options?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const SpecificationFieldTemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    type: { type: String, required: true, enum: ['text', 'number', 'weight', 'color', 'select'] },
    options: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.SpecificationFieldTemplate ||
  mongoose.model<ISpecificationFieldTemplate>('SpecificationFieldTemplate', SpecificationFieldTemplateSchema);
