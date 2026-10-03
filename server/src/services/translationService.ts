import fs from 'fs';
import path from 'path';
import { aiClient, GEMINI_FALLBACK_MODELS, GEMINI_MODEL, GEMINI_TIMEOUT_MS } from '../config/gemini';
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
const CACHE_FILE = path.join(__dirname, '../../.cache/translations.json');

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
      fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)));
    } catch (err) {
      console.warn('Could not save translation cache:', (err as Error).message);
    }
  }, 1500);
};

const key = (lang: string, mode: TranslationMode, id: string) => `${lang}:${mode}:${id}`;

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

const sanitize = (t: SchemeTranslation, src: SchemeTranslation): SchemeTranslation => ({
  name: t.name?.trim() || undefined,
  ministryOrDepartment: t.ministryOrDepartment?.trim() || undefined,
  description: t.description?.trim() || undefined,
  summaryText: t.summaryText?.trim() || undefined,
  financialBenefit: t.financialBenefit?.trim() || undefined,
  tags: sameLength(t.tags, src.tags),
  detailsText: sameLength(t.detailsText, src.detailsText),
  benefitsText: sameLength(t.benefitsText, src.benefitsText),
  eligibilityText: sameLength(t.eligibilityText, src.eligibilityText),
  exclusionsText: sameLength(t.exclusionsText, src.exclusionsText),
  documentsRequired: sameLength(t.documentsRequired, src.documentsRequired),
  applicationSteps: sameLength(t.applicationSteps, src.applicationSteps)
});

async function translateBatch(schemes: Scheme[], lang: string, mode: TranslationMode): Promise<void> {
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
  for (const model of MODELS) {
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
        if (src) cache.set(key(lang, mode, t.id), sanitize(t, src));
      }
      persist();
      return;
    } catch (err) {
      lastErr = err;
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
  public static async translate(schemes: Scheme[], lang: string, mode: TranslationMode): Promise<Record<string, SchemeTranslation>> {
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
          translateBatch(batch, lang, mode)
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
          translateBatch([s], lang, mode).catch((err) => console.warn(`Translation retry for ${s.schemeId} failed:`, (err as Error).message?.slice(0, 120)))
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
