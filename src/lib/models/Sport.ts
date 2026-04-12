import mongoose, { Schema, Document } from 'mongoose';

export interface ISport extends Document {
  _id: string;
  name: string;
  equipmentTypes: string[];
  imageKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SportSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Sport name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Sport name cannot exceed 50 characters'],
  },
  equipmentTypes: [{
    type: String,
    required: [true, 'At least one equipment type is required'],
    trim: true,
  }],
  imageKey: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Add index for better query performance
SportSchema.index({ name: 1 });

export default mongoose.models.Sport || mongoose.model<ISport>('Sport', SportSchema);