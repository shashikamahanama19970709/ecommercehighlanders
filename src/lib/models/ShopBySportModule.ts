import mongoose, { Schema, Document } from 'mongoose';

export interface IShopBySportEntry {
  sport: mongoose.Types.ObjectId;
  heroImageKey?: string;
  productIds: mongoose.Types.ObjectId[];
}

export interface IShopBySportModule extends Document {
  entries: IShopBySportEntry[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ShopBySportEntrySchema = new Schema<IShopBySportEntry>(
  {
    sport: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    heroImageKey: { type: String, trim: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
  },
  { _id: false }
);

const ShopBySportModuleSchema = new Schema<IShopBySportModule>(
  {
    entries: {
      type: [ShopBySportEntrySchema],
      default: [],
      validate: {
        validator: (entries: IShopBySportEntry[]) => Array.isArray(entries) && entries.length <= 5,
        message: 'Shop by sport can contain at most 5 sports',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.ShopBySportModule ||
  mongoose.model<IShopBySportModule>('ShopBySportModule', ShopBySportModuleSchema);
