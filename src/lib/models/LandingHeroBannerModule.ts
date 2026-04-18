import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ILandingHeroBannerEntry {
  sport: mongoose.Types.ObjectId;
  videoKey: string;
}

export interface ILandingHeroBannerModule extends Document {
  moduleName: 'landing-hero-banner';
  entries: ILandingHeroBannerEntry[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const LandingHeroBannerEntrySchema = new Schema<ILandingHeroBannerEntry>(
  {
    sport: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    videoKey: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const LandingHeroBannerModuleSchema = new Schema<ILandingHeroBannerModule>(
  {
    moduleName: {
      type: String,
      required: true,
      enum: ['landing-hero-banner'],
      unique: true,
      default: 'landing-hero-banner',
    },
    entries: {
      type: [LandingHeroBannerEntrySchema],
      default: [],
      validate: {
        validator: (entries: ILandingHeroBannerEntry[]) => Array.isArray(entries) && entries.length <= 3,
        message: 'Landing hero banner can contain at most 3 sports',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LandingHeroBannerModule =
  (mongoose.models.LandingHeroBannerModule as Model<ILandingHeroBannerModule>) ||
  mongoose.model<ILandingHeroBannerModule>('LandingHeroBannerModule', LandingHeroBannerModuleSchema);

export default LandingHeroBannerModule;
