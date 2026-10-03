import { SchemeModel } from '../models/Scheme';
import { VERIFIED_SCHEMES_100 } from '../../../shared/seedSchemes';

export { VERIFIED_SCHEMES_100 };

/**
 * Makes the MongoDB scheme catalog match the official dataset exactly: every scheme is
 * upserted (so changed records are updated) and schemes no longer in the dataset are removed.
 * Runs on every start, so the database can never serve an older catalog than the code ships.
 */
export const syncSchemes = async (): Promise<void> => {
  try {
    const ids = VERIFIED_SCHEMES_100.map((s) => s.schemeId);
    const result = await SchemeModel.bulkWrite(
      VERIFIED_SCHEMES_100.map((scheme) => ({
        replaceOne: { filter: { schemeId: scheme.schemeId }, replacement: scheme, upsert: true }
      })),
      { ordered: false }
    );
    const removed = await SchemeModel.deleteMany({ schemeId: { $nin: ids } });
    console.log(
      `✅ Scheme catalog synced to MongoDB: ${ids.length} schemes (${result.upsertedCount} added, ${result.modifiedCount} updated, ${removed.deletedCount} removed)`
    );
  } catch (error) {
    console.error('❌ Scheme catalog sync failed:', (error as Error).message);
  }
};
