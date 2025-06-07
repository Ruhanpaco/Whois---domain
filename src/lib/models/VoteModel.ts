import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  featureId: string;
  ipHash: string;
  fingerprint: string;
  votedAt: Date;
  userId?: string; // For future use if we implement authentication
}

const VoteSchema: Schema = new Schema(
  {
    featureId: {
      type: String,
      required: true,
    },
    ipHash: {
      type: String,
      required: true,
    },
    fingerprint: {
      type: String,
      required: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: String,
    }
  },
  {
    timestamps: {
      createdAt: 'votedAt',
      updatedAt: false,
    },
  }
);

// Create a compound index to ensure uniqueness based on feature + IP hash + fingerprint
VoteSchema.index({ featureId: 1, ipHash: 1, fingerprint: 1 }, { unique: true });

// Check if the model already exists before creating it
export default mongoose.models.Vote ||
  mongoose.model<IVote>('Vote', VoteSchema); 