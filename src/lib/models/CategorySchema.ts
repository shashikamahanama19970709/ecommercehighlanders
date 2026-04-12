import mongoose, { Schema, Document } from 'mongoose';

export interface IFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required?: boolean;
}

export interface ICategorySchema extends Document {
  equipmentType: string;
  fields: IFieldDefinition[];
}

const FieldDefinitionSchema: Schema = new Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true, enum: ['text', 'number', 'select'] },
  options: [{ type: String }],
  required: { type: Boolean, default: false },
});

const CategorySchemaSchema: Schema = new Schema({
  equipmentType: { type: String, required: true, unique: true },
  fields: [FieldDefinitionSchema],
});

export default mongoose.models.CategorySchema || mongoose.model<ICategorySchema>('CategorySchema', CategorySchemaSchema);