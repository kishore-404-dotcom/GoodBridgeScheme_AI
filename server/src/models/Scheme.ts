import mongoose, { Schema } from 'mongoose';
import { Scheme } from '../../../shared/types';

/**
 * Scheme catalog. Documents mirror the official dataset in shared/seedSchemes.ts exactly
 * (synced on every start), so the schema declares only the indexed fields and keeps the
 * rest of each record as-is (strict: false) instead of silently dropping newer fields.
 */
const SchemeSchema = new Schema(
  {
    schemeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    level: { type: String, enum: ['Central', 'State'], index: true },
    state: { type: String, index: true }
  },
  { strict: false, timestamps: true, versionKey: false }
);

export type SchemeDocument = Scheme & { createdAt?: Date; updatedAt?: Date };

export const SchemeModel = mongoose.model<SchemeDocument>('Scheme', SchemeSchema);
