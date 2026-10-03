import mongoose, { Schema } from 'mongoose';

/**
 * AI translations of official scheme text, shared by every visitor and kept across
 * redeploys (Render's free disk is wiped on each deploy). `key` is `${lang}:${mode}:${schemeId}`.
 */
const TranslationSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    lang: { type: String, required: true },
    mode: { type: String, enum: ['card', 'full'], required: true },
    schemeId: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true, versionKey: false }
);

export const TranslationModel = mongoose.model('Translation', TranslationSchema);
