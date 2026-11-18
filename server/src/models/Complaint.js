import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants.js';

const analysisSchema = new mongoose.Schema(
  {
    category: { type: String, enum: CATEGORIES },
    priority: { type: String, enum: PRIORITIES },
    priorityReason: String,
    summary: String,
    suggestedResponse: String,
    aiModel: String,
    analyzedAt: Date,
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },

    status: { type: String, enum: STATUSES, default: 'Pending', index: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // 'success' = analysis saved, 'failed' = complaint saved but AI unavailable (can be retried)
    aiStatus: { type: String, enum: ['success', 'failed'], default: 'failed' },
    analysis: { type: analysisSchema, default: undefined },
    aiError: { type: String, select: false },
  },
  { timestamps: true }
);

complaintSchema.index({ 'analysis.category': 1, 'analysis.priority': 1 });
complaintSchema.index({ createdAt: -1 });

complaintSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.aiError; // internal detail, never sent to clients
    return ret;
  },
});

export default mongoose.model('Complaint', complaintSchema);
