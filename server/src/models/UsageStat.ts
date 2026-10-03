import mongoose, { Schema } from 'mongoose';

/**
 * Anonymous daily usage counters: one document per day, e.g.
 * { day: '2026-10-03', counts: { chat: 12, 'chat:ta': 5, eligibility_check: 3 } }.
 * Only counts are stored: no queries, profiles, IP addresses or other personal data.
 */
const UsageStatSchema = new Schema(
  {
    day: { type: String, required: true, unique: true, index: true },
    counts: { type: Map, of: Number, default: {} }
  },
  { versionKey: false }
);

export const UsageStatModel = mongoose.model('UsageStat', UsageStatSchema);
