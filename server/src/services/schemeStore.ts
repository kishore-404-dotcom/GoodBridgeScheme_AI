import { SchemeModel } from '../models/Scheme';
import { isDatabaseConnected } from '../config/database';
import { VERIFIED_SCHEMES_100 } from '../scripts/seedSchemes';
import { Scheme } from '../../../shared/types';

/**
 * Scheme Store
 * Reads schemes from MongoDB when connected, otherwise from the bundled local dataset.
 */
export class SchemeStore {
  public static async getAll(): Promise<Scheme[]> {
    if (isDatabaseConnected()) {
      try {
        const schemes = (await SchemeModel.find().lean()) as unknown as Scheme[];
        if (schemes.length > 0) return schemes;
      } catch (err) {
        console.error('MongoDB scheme query failed, using local dataset:', (err as Error).message);
      }
    }
    return VERIFIED_SCHEMES_100;
  }

  public static async getById(schemeId: string): Promise<Scheme | null> {
    const schemes = await this.getAll();
    return schemes.find((s) => s.schemeId === schemeId) || null;
  }
}
