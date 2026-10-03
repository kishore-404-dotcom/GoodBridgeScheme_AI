import { SchemeModel } from '../models/Scheme';
import { isDatabaseConnected } from '../config/database';
import { VERIFIED_SCHEMES_100 } from '../scripts/seedSchemes';
import { Scheme } from '../../../shared/types';

/** The catalog changes only on deploy (it is synced at start), so it is cached between reads */
const REFRESH_MS = 5 * 60 * 1000;

let cached: Scheme[] | null = null;
let cachedAt = 0;
let loading: Promise<Scheme[]> | null = null;

const loadFromDb = async (): Promise<Scheme[]> => {
  const schemes = (await SchemeModel.find({}, { _id: 0, createdAt: 0, updatedAt: 0 }).lean()) as unknown as Scheme[];
  return schemes.length > 0 ? schemes : VERIFIED_SCHEMES_100;
};

/**
 * Scheme Store
 * Reads the catalog from MongoDB when connected (cached in memory, refreshed every few minutes),
 * otherwise from the bundled official dataset.
 */
export class SchemeStore {
  public static async getAll(): Promise<Scheme[]> {
    if (!isDatabaseConnected()) return VERIFIED_SCHEMES_100;
    if (cached && Date.now() - cachedAt < REFRESH_MS) return cached;
    if (!loading) {
      loading = loadFromDb()
        .then((schemes) => {
          cached = schemes;
          cachedAt = Date.now();
          return schemes;
        })
        .catch((err) => {
          console.error('MongoDB scheme query failed, using local dataset:', (err as Error).message);
          return cached || VERIFIED_SCHEMES_100;
        })
        .finally(() => {
          loading = null;
        });
    }
    return loading;
  }

  public static async getById(schemeId: string): Promise<Scheme | null> {
    const schemes = await this.getAll();
    return schemes.find((s) => s.schemeId === schemeId) || null;
  }

  /** Forget the cached catalog (after a sync) */
  public static invalidate(): void {
    cached = null;
  }
}
