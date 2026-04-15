import mongoose, { type Model } from 'mongoose';

export interface AboutUsModuleDocument extends mongoose.Document {
  moduleName: 'about-us';
  title: string;
  description: string;
  image1Key?: string;
  image1Url?: string;
  image2Key?: string;
  image2Url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AboutUsModuleSchema = new mongoose.Schema<AboutUsModuleDocument>(
  {
    moduleName: {
      type: String,
      required: true,
      enum: ['about-us'],
      unique: true,
      default: 'about-us',
    },
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    image1Key: { type: String },
    image1Url: { type: String },
    image2Key: { type: String },
    image2Url: { type: String },
  },
  { timestamps: true }
);

const AboutUsModule =
  (mongoose.models.AboutUsModule as Model<AboutUsModuleDocument>) ||
  mongoose.model<AboutUsModuleDocument>('AboutUsModule', AboutUsModuleSchema);

export default AboutUsModule;
