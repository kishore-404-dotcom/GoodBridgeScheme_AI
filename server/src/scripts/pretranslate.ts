/**
 * Pre-translates scheme text into regional languages and stores it in data/translations.json,
 * so those pages are instant for every visitor (and survive redeploys) with no live AI call.
 *
 * Usage (from server/):
 *   npx ts-node src/scripts/pretranslate.ts                  # first 20 schemes, card text, all languages
 *   npx ts-node src/scripts/pretranslate.ts --count 40 --mode full --langs ta,hi
 *
 * It uses models the live chat does not rely on (GEMINI_PRETRANSLATE_MODELS) so the chat keeps
 * its free-tier quota, and stops early when every model has used up its quota (re-run later:
 * already-translated schemes are skipped).
 */
import 'dotenv/config';
import { VERIFIED_SCHEMES_100 } from '../../../shared/seedSchemes';
import { TranslationService, TRANSLATION_LANGUAGES, TranslationMode } from '../services/translationService';
import { usableModels, isModelAvailable } from '../config/modelHealth';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const COUNT = Number(arg('count', '20'));
const MODE = arg('mode', 'card') as TranslationMode;
const LANGS = arg('langs', Object.keys(TRANSLATION_LANGUAGES).join(',')).split(',').filter((l) => l in TRANSLATION_LANGUAGES);
const MODELS = (process.env.GEMINI_PRETRANSLATE_MODELS || 'gemini-3.1-flash-lite,gemini-3.5-flash-lite').split(',').map((m) => m.trim());
const STEP = MODE === 'card' ? 5 : 1;

const main = async () => {
  // Same order as the schemes page shows by default
  const schemes = VERIFIED_SCHEMES_100.slice(0, COUNT);
  console.log(`Pre-translating ${schemes.length} schemes (${MODE}) into ${LANGS.join(', ')} using ${MODELS.join(', ')}`);

  let done = 0;
  for (const lang of LANGS) {
    for (let i = 0; i < schemes.length; i += STEP) {
      if (!MODELS.some(isModelAvailable)) {
        console.log('All pre-translation models have used their free quota for now. Re-run later to continue.');
        await new Promise((r) => setTimeout(r, 2000)); // let the cache file flush
        return;
      }
      const batch = schemes.slice(i, i + STEP);
      const out = await TranslationService.translate(batch, lang, MODE, usableModels(MODELS));
      done += Object.keys(out).length;
    }
    console.log(`  ${lang}: done (${done} translations available so far)`);
  }
  await new Promise((r) => setTimeout(r, 2500)); // let the debounced cache write finish
  console.log('Finished. Commit server/data/translations.json to ship these translations.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
