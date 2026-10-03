import mongoose, { Schema } from 'mongoose';

export const FEEDBACK_TYPES = ['helpful', 'not_helpful', 'wrong_info'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/** Citizen feedback on a scheme page. No personal data is stored. */
const FeedbackSchema = new Schema(
  {
    schemeId: { type: String, required: true, index: true },
    type: { type: String, enum: FEEDBACK_TYPES, required: true },
    message: { type: String, maxlength: 1000 },
    language: { type: String, maxlength: 5 },
    resolved: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

export const FeedbackModel = mongoose.model('Feedback', FeedbackSchema);
