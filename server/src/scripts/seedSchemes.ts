import { SchemeModel } from '../models/Scheme';
import { VERIFIED_SCHEMES_100 } from '../../../shared/seedSchemes';

export { VERIFIED_SCHEMES_100 };

/**
 * Seeder execution function for MongoDB
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    const existingCount = await SchemeModel.countDocuments();
    if (existingCount === 0) {
      await SchemeModel.insertMany(VERIFIED_SCHEMES_100);
      console.log(`✅ Seeded ${VERIFIED_SCHEMES_100.length} verified schemes into MongoDB Atlas!`);
    } else {
      console.log(`ℹ️ Database already contains ${existingCount} schemes. Skipping seed.`);
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};
