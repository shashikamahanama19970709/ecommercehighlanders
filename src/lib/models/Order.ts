import { Schema, model, models } from 'mongoose';

const DeliveryLocationSchema = new Schema({
  lat: Number,
  lng: Number,
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const OrderSchema = new Schema({
  userId: { type: String },
  email: { type: String, required: true },
  currency: { type: String, required: true },
  items: { type: Array, required: true },
  totalUsd: { type: Number, required: true },
  status: { type: String, required: true },
  stripeSessionId: { type: String },
  shipping: { type: Object },
  tax: { type: Object },
  discount: { type: Object },
  deliveryLocation: { type: DeliveryLocationSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default models.Order || model('Order', OrderSchema);
