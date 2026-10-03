import { UsageStatModel } from '../models/UsageStat';
import { isDatabaseConnected } from '../config/database';

/** Event names that may be counted; anything else is ignored */
export const TRACKED_EVENTS = [
  'search',
  'scheme_view',
  'eligibility_check',
  'chat',
  'translation',
  'voice',
  'feedback'
] as const;
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

const LANG = /^[a-z]{2}$/;
const FLUSH_MS = 15_000;

/** Counts are batched in memory and written as one $inc per day, so tracking costs ~1 write/15s */
let pending = new Map<string, Map<string, number>>();
let timer: NodeJS.Timeout | null = null;

const today = () => new Date().toISOString().slice(0, 10);

const flush = async () => {
  timer = null;
  if (!isDatabaseConnected() || pending.size === 0) return;
  const batch = pending;
  pending = new Map();
  for (const [day, counts] of batch) {
    const inc = Object.fromEntries([...counts].map(([k, v]) => [`counts.${k}`, v]));
    try {
      await UsageStatModel.updateOne({ day }, { $inc: inc }, { upsert: true });
    } catch (err) {
      console.warn('Usage stats write failed:', (err as Error).message);
    }
  }
};

export class StatsService {
  /** Counts one anonymous event, optionally per language (e.g. chat + chat:ta) */
  public static track(event: TrackedEvent, language?: string): void {
    if (!isDatabaseConnected()) return;
    const day = today();
    const counts = pending.get(day) || new Map<string, number>();
    counts.set(event, (counts.get(event) || 0) + 1);
    if (language && LANG.test(language)) counts.set(`${event}:${language}`, (counts.get(`${event}:${language}`) || 0) + 1);
    pending.set(day, counts);
    if (!timer) timer = setTimeout(flush, FLUSH_MS);
  }

  /** Totals for the last `days` days, plus per-day rows */
  public static async summary(days = 30): Promise<{ totals: Record<string, number>; byDay: { day: string; counts: Record<string, number> }[] }> {
    await flush();
    const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const rows = await UsageStatModel.find({ day: { $gte: since } }).sort({ day: 1 }).lean();
    const totals: Record<string, number> = {};
    const byDay = rows.map((r) => {
      const counts = Object.fromEntries(Object.entries((r.counts as unknown as Record<string, number>) || {}));
      Object.entries(counts).forEach(([k, v]) => (totals[k] = (totals[k] || 0) + v));
      return { day: r.day as string, counts };
    });
    return { totals, byDay };
  }
}
