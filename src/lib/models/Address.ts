import mongoose, { Schema, model, models } from 'mongoose';

const AddressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String },
  name: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  region: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export const Address = models.Address || model('Address', AddressSchema);
