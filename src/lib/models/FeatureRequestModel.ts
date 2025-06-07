import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureRequest extends Document {
  featureId: string;
  title: string;
  description: string;
  votes: number;
  status: 'pending' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';
  submittedBy?: string;
  submittedAt: Date;
  lastUpdatedAt: Date;
  tags: string[];
}

const FeatureRequestSchema: Schema = new Schema(
  {
    featureId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    votes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'planned', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
    },
    submittedBy: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: 'submittedAt',
      updatedAt: 'lastUpdatedAt',
    },
  }
);

// Check if the model already exists before creating it
export default mongoose.models.FeatureRequest || 
  mongoose.model<IFeatureRequest>('FeatureRequest', FeatureRequestSchema); 