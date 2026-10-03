import mongoose, { Schema } from 'mongoose';

export const FEEDBACK_TYPES = ['helpful', 'not_helpful', 'wrong_info'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/** What a "wrong information" report is about, so reports can be sorted and fixed faster */
export const REPORT_REASONS = ['link', 'eligibility', 'benefit', 'documents', 'outdated', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Citizen feedback on a scheme page. No personal data is stored. */
const FeedbackSchema = new Schema(
  {
    schemeId: { type: String, required: true, index: true },
    type: { type: String, enum: FEEDBACK_TYPES, required: true },
    reason: { type: String, enum: REPORT_REASONS },
    message: { type: String, maxlength: 1000 },
    language: { type: String, maxlength: 5 },
    resolved: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

export const FeedbackModel = mongoose.model('Feedback', FeedbackSchema);
