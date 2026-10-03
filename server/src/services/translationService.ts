import fs from 'fs';
import path from 'path';
import { aiClient, GEMINI_FALLBACK_MODELS, GEMINI_MODEL, GEMINI_TIMEOUT_MS } from '../config/gemini';
import { reportModelFailure, usableModels } from '../config/modelHealth';
import { isDatabaseConnected } from '../config/database';
import { TranslationModel } from '../models/Translation';
import { Scheme, SchemeStep } from '../../../shared/types';

/** Language codes the site supports (English is the source language) */
export const TRANSLATION_LANGUAGES: Record<string, string> = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  kn: 'Kannada',
  gu: 'Gujarati',
  ml: 'Malayalam',
  pa: 'Punjabi'
};

export type TranslationMode = 'card' | 'full';

/** Translated text fields of a scheme; anything missing falls back to the official English text */
export interface SchemeTranslation {
  name?: string;
  ministryOrDepartment?: string;
  description?: string;
  summaryText?: string;
  financialBenefit?: string;
  tags?: string[];
  detailsText?: string[];
  benefitsText?: string[];
  eligibilityText?: string[];
  exclusionsText?: string[];
  documentsRequired?: string[];
  applicationSteps?: SchemeStep[];
}

// Small batches keep the model from dropping items from long responses
const CARD_BATCH = 5;
// Lite model first: translation needs speed more than reasoning
const MODELS = [...new Set(['gemini-flash-lite-latest', GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS])];
// Retries (after a dropped or garbled result) go to a stronger model first
const RETRY_MODELS = [
  ...new Set([...(process.env.GEMINI_TRANSLATE_RETRY_MODELS || 'gemini-3.5-flash-lite,gemini-3.6-flash').split(',').map((m) => m.trim()), ...MODELS])
];
// Kept in the repository (server/data) so translations made once ship with every deploy;
// resolved from the server folder because compiled code runs from dist/
const CACHE_FILE = path.resolve(process.cwd(), 'data/translations.json');

const cache = new Map<string, SchemeTranslation>();
const inFlight = new Map<string, Promise<void>>();
let saveTimer: NodeJS.Timeout | null = null;

try {
  const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as Record<string, SchemeTranslation>;
  Object.entries(saved).forEach(([k, v]) => cache.set(k, v));
  console.log(`🌐 Loaded ${cache.size} cached scheme translations`);
} catch {
  // No cache yet
}

/** Debounced write so a burst of translations is saved once */
const persist = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      const entries = [...cache.entries()].sort(([a], [b]) => a.localeCompare(b));
      // One entry per line with sorted keys keeps the committed file's diffs small
      const body = entries.map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
      fs.writeFileSync(CACHE_FILE, `{\n${body}\n}\n`);
    } catch (err) {
      console.warn('Could not save translation cache:', (err as Error).message);
    }
  }, 1500);
};

const key = (lang: string, mode: TranslationMode, id: string) => `${lang}:${mode}:${id}`;

/** Saves one translation to MongoDB (shared by all servers, survives redeploys); best effort */
const saveToDb = (k: string, value: SchemeTranslation) => {
  if (!isDatabaseConnected()) return;
  const [lang, mode, ...rest] = k.split(':');
  TranslationModel.updateOne({ key: k }, { $set: { key: k, lang, mode: mode as TranslationMode, schemeId: rest.join(':'), data: value } }, { upsert: true }).catch((err) =>
    console.warn('Could not save translation to MongoDB:', (err as Error).message)
  );
};

/**
 * Merges translations stored in MongoDB into the cache, and uploads translations that exist only
 * in the shipped file, so the database ends up with everything. Call once after connecting.
 */
export const syncTranslationsWithDb = async (): Promise<void> => {
  if (!isDatabaseConnected()) return;
  try {
    const rows = await TranslationModel.find({}, { _id: 0, key: 1, data: 1 }).lean();
    const inDb = new Set<string>();
    for (const row of rows as { key: string; data: SchemeTranslation }[]) {
      inDb.add(row.key);
      cache.set(row.key, row.data);
    }
    const missing = [...cache.entries()].filter(([k]) => !inDb.has(k));
    if (missing.length) {
      await TranslationModel.bulkWrite(
        missing.map(([k, data]) => {
          const [lang, mode, ...rest] = k.split(':');
          return { updateOne: { filter: { key: k }, update: { $set: { key: k, lang, mode: mode as TranslationMode, schemeId: rest.join(':'), data } }, upsert: true } };
        }),
        { ordered: false }
      );
    }
    console.log(`🌐 Translations synced with MongoDB: ${rows.length} loaded, ${missing.length} uploaded (${cache.size} total)`);
  } catch (err) {
    console.warn('Translation sync with MongoDB failed:', (err as Error).message);
  }
};

/** The English source fields sent for translation */
const sourceFields = (s: Scheme, mode: TranslationMode): SchemeTranslation =>
  mode === 'card'
    ? { name: s.name, ministryOrDepartment: s.ministryOrDepartment, summaryText: s.summaryText, financialBenefit: s.financialBenefit, tags: s.tags.slice(0, 4) }
    : {
        name: s.name,
        ministryOrDepartment: s.ministryOrDepartment,
        description: s.description,
        financialBenefit: s.financialBenefit,
        detailsText: s.detailsText || [],
        benefitsText: s.benefitsText || [],
        eligibilityText: s.eligibilityText || [],
        exclusionsText: s.exclusionsText || [],
        documentsRequired: s.documentsRequired,
        applicationSteps: s.applicationSteps.map(({ stepNumber, title, description }) => ({ stepNumber, title, description }))
      };

/** Keeps a translated list only if it lines up item-for-item with the official list */
const sameLength = <T,>(translated: T[] | undefined, source: unknown[] | undefined): T[] | undefined =>
  Array.isArray(translated) && Array.isArray(source) && translated.length === source.length ? translated : undefined;

/** Unicode block of each language's script, to confirm the text was actually translated */
const SCRIPT: Record<string, RegExp> = {
  hi: /[ऀ-ॿ]/, mr: /[ऀ-ॿ]/, bn: /[ঀ-৿]/, pa: /[਀-੿]/, gu: /[઀-૿]/,
  ta: /[஀-௿]/, te: /[ఀ-౿]/, kn: /[ಀ-೿]/, ml: /[ഀ-ൿ]/
};
/** The main prose field must be in the target script (names alone may legitimately stay as acronyms) */
const isUntranslated = (t: SchemeTranslation, lang: string): boolean => {
  const prose = t.summaryText || t.description || t.financialBenefit || "";
  // A name made of ordinary words (not just acronyms like "PM-KISAN") should be in the target script too
  const nameNeedsScript = !!t.name && /[a-z]{3,}/.test(t.name);
  return !SCRIPT[lang]?.test(prose) || (nameNeedsScript && !SCRIPT[lang]?.test(t.name || ""));
};

/**
 * Garbled output: lowercase Latin glued to Indic letters inside a word ("কisan"; uppercase acronyms with
 * grammatical endings like "KCCর" are normal), or letters from another script (e.g. Arabic in Gurmukhi).
 */
const MIXED_LATIN = /[a-z][ऀ-෿]|[ऀ-෿][a-z]/;
const OTHER_SCRIPTS = /[؀-ۿݐ-ݿऀ-ॣ०-෿]/;
const isGarbledText = (text: string, lang: string): boolean => {
  if (MIXED_LATIN.test(text)) return true;
  const target = SCRIPT[lang];
  const rest = target ? text.replace(new RegExp(target.source, 'g'), '') : text;
  return OTHER_SCRIPTS.test(rest);
};

/**
 * Lines up the translation with the official text. A garbled line (e.g. a half-transliterated word)
 * falls back to its official English line, so one bad word doesn't discard the whole page.
 * `replaced` counts those fallbacks.
 */
const sanitize = (t: SchemeTranslation, src: SchemeTranslation, lang: string): { clean: SchemeTranslation; replaced: number; total: number } => {
  let replaced = 0;
  let total = 0;
  const text = (value: string | undefined, original: string | undefined): string | undefined => {
    const v = value?.trim();
    if (!v || original === undefined) return undefined;
    total++;
    if (isGarbledText(v, lang)) {
      replaced++;
      return undefined; // field falls back to English
    }
    return v;
  };
  const list = (values: string[] | undefined, originals: string[] | undefined): string[] | undefined => {
    const aligned = sameLength(values, originals);
    if (!aligned || !originals) return undefined;
    return aligned.map((v, i) => text(String(v), originals[i]) ?? originals[i]);
  };
  const steps = sameLength(t.applicationSteps, src.applicationSteps)?.map((step, i) => {
    const o = src.applicationSteps![i];
    return { stepNumber: o.stepNumber, title: text(step.title, o.title) ?? o.title, description: text(step.description, o.description) ?? o.description };
  });
  const clean: SchemeTranslation = {
    name: text(t.name, src.name),
    ministryOrDepartment: text(t.ministryOrDepartment, src.ministryOrDepartment),
    description: text(t.description, src.description),
    summaryText: text(t.summaryText, src.summaryText),
    financialBenefit: text(t.financialBenefit, src.financialBenefit),
    tags: list(t.tags, src.tags),
    detailsText: list(t.detailsText, src.detailsText),
    benefitsText: list(t.benefitsText, src.benefitsText),
    eligibilityText: list(t.eligibilityText, src.eligibilityText),
    exclusionsText: list(t.exclusionsText, src.exclusionsText),
    documentsRequired: list(t.documentsRequired, src.documentsRequired),
    applicationSteps: steps
  };
  return { clean, replaced, total };
};

async function translateBatch(schemes: Scheme[], lang: string, mode: TranslationMode, models: string[] = MODELS): Promise<void> {
  const language = TRANSLATION_LANGUAGES[lang];
  const items = schemes.map((s) => ({ id: s.schemeId, ...sourceFields(s, mode) }));

  const systemInstruction = `Translate official Indian government scheme information from English into ${language} for citizens.
Rules:
- Translate faithfully and completely. Do not add, remove, summarise or explain anything.
- Keep every number, ₹ amount, percentage, date, URL, email and phone number exactly as written.
- Keep well-known acronyms (PM-KISAN, BPL, SC/ST/OBC, Aadhaar, CSC, MSME) as they are.
- For scheme names, write the natural ${language} name; keep official acronyms.
- EVERY text value must be in ${language}, including name, financialBenefit, summaryText, tags and every list item. Never leave English sentences.
- Return a JSON array with one object per input object: the same keys, the same "id" and "stepNumber" values, and every list with exactly the same number of items in the same order.`;

  let lastErr: unknown;
  for (const model of usableModels(models)) {
    try {
      const res = await aiClient!.models.generateContent({
        model,
        contents: JSON.stringify(items),
        config: {
          httpOptions: { timeout: Math.max(GEMINI_TIMEOUT_MS, 30000) },
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });
      const parsed = JSON.parse(res.text || '[]');
      // Accept a bare object for single-scheme requests, or { items: [...] } wrappers
      const translated = (Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [parsed]) as (SchemeTranslation & { id: string })[];
      for (const t of translated) {
        const src = items.find((i) => i.id === t.id);
        if (!src) continue;
        const { clean, replaced, total } = sanitize(t, src, lang);
        // Mostly-garbled output is rejected so another model retries; a few bad lines are tolerated
        const tooBroken = total > 0 && replaced / total > 0.5;
        // Rejected output is not cached, so the retry below (or a later request) translates it again
        if (tooBroken || isUntranslated(clean, lang)) console.warn(`Discarded garbled/untranslated ${lang} translation for ${t.id}`);
        else {
          cache.set(key(lang, mode, t.id), clean);
          saveToDb(key(lang, mode, t.id), clean);
        }
      }
      persist();
      // Done when every scheme got a clean translation; otherwise try the next model for the rest
      if (items.every((i) => cache.has(key(lang, mode, i.id)))) return;
      lastErr = new Error(`incomplete or garbled ${lang} output from ${model}`);
    } catch (err) {
      lastErr = err;
      reportModelFailure(model, err);
      console.warn(`Translation with ${model} failed:`, (err as Error).message.slice(0, 120));
    }
  }
  throw lastErr;
}

export class TranslationService {
  public static isSupported(lang: string): boolean {
    return lang in TRANSLATION_LANGUAGES;
  }

  /**
   * Returns translations for the given schemes, translating (and caching) any that are missing.
   * Schemes that fail to translate are simply absent from the result, so the client shows English.
   */
  public static async translate(
    schemes: Scheme[],
    lang: string,
    mode: TranslationMode,
    /** Override the model order (e.g. offline pre-translation on models the live chat does not use) */
    models: string[] = MODELS
  ): Promise<Record<string, SchemeTranslation>> {
    if (!aiClient || !this.isSupported(lang)) return {};

    const missing = schemes.filter((s) => !cache.has(key(lang, mode, s.schemeId)));
    const batchSize = mode === 'card' ? CARD_BATCH : 1;
    const jobs: Promise<void>[] = [];
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      const jobKey = `${lang}:${mode}:${batch.map((s) => s.schemeId).join(',')}`;
      // Identical concurrent requests share one Gemini call
      if (!inFlight.has(jobKey)) {
        inFlight.set(
          jobKey,
          translateBatch(batch, lang, mode, models)
            .catch((err) => console.warn('Translation batch failed:', (err as Error).message?.slice(0, 120)))
            .finally(() => inFlight.delete(jobKey))
        );
      }
      jobs.push(inFlight.get(jobKey)!);
    }
    await Promise.all(jobs);

    // Retry once, one scheme per call, for anything the model left out of a batch response
    const stillMissing = schemes.filter((s) => !cache.has(key(lang, mode, s.schemeId)));
    if (stillMissing.length > 0 && stillMissing.length < schemes.length + 1) {
      await Promise.all(
        stillMissing.map((s) =>
          translateBatch([s], lang, mode, RETRY_MODELS).catch((err) => console.warn(`Translation retry for ${s.schemeId} failed:`, (err as Error).message?.slice(0, 120)))
        )
      );
    }

    const out: Record<string, SchemeTranslation> = {};
    for (const s of schemes) {
      const t = cache.get(key(lang, mode, s.schemeId));
      if (t) out[s.schemeId] = t;
    }
    return out;
  }
}
