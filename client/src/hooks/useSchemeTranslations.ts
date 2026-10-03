import { useEffect, useMemo, useState } from 'react';
import { Scheme } from '../../../shared/types';
import { useLanguage } from '../context/LanguageContext';
import { ApiService, SchemeTranslation, TranslationMode } from '../services/apiService';
import { readStore, writeStore } from '../utils/storage';

/**
 * Cache shared by every component: `${lang}:${mode}:${schemeId}` -> translation.
 * Persisted in localStorage so translations seen once are instant on later visits.
 */
const STORE_KEY = 'translations';
const MAX_STORED = 400;
const cache = new Map<string, SchemeTranslation>(readStore<[string, SchemeTranslation][]>(STORE_KEY, []));
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const persist = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    // Most recently added entries are kept when trimming
    writeStore(STORE_KEY, [...cache.entries()].slice(-MAX_STORED));
  }, 1000);
};
/** Keys with a request currently in flight (never requested twice at once) */
const inFlight = new Set<string>();
/** Components re-render when any translation lands */
const listeners = new Set<() => void>();
const BATCH = { card: 10, full: 1 };

const key = (lang: string, mode: TranslationMode, id: string) => `${lang}:${mode}:${id}`;
const notify = () => listeners.forEach((l) => l());

async function fetchBatch(lang: string, mode: TranslationMode, ids: string[]) {
  ids.forEach((id) => inFlight.add(key(lang, mode, id)));
  notify();
  const translations = await ApiService.translateSchemes(lang, ids, mode);
  Object.entries(translations).forEach(([id, t]) => cache.set(key(lang, mode, id), t));
  if (Object.keys(translations).length) persist();
  // Ids the server could not translate this time are released, so a later visit can retry
  ids.forEach((id) => inFlight.delete(key(lang, mode, id)));
  notify();
}

/** Starts translating in the background (e.g. on hover) so the page is ready when opened */
export const prefetchSchemeTranslation = (lang: string, schemeId: string, mode: TranslationMode): void => {
  if (lang === 'en' || cache.has(key(lang, mode, schemeId)) || inFlight.has(key(lang, mode, schemeId))) return;
  fetchBatch(lang, mode, [schemeId]);
};

/** Overlays translated text onto the official scheme; untranslated fields stay in English */
const merge = (s: Scheme, t: SchemeTranslation | undefined): Scheme => {
  if (!t) return s;
  const pick = <T,>(value: T | undefined, fallback: T): T => (value === undefined || value === null ? fallback : value);
  return {
    ...s,
    name: pick(t.name, s.name),
    ministryOrDepartment: pick(t.ministryOrDepartment, s.ministryOrDepartment),
    description: pick(t.description, s.description),
    summaryText: pick(t.summaryText, s.summaryText),
    financialBenefit: pick(t.financialBenefit, s.financialBenefit),
    tags: pick(t.tags, s.tags),
    detailsText: pick(t.detailsText, s.detailsText),
    benefitsText: pick(t.benefitsText, s.benefitsText),
    eligibilityText: pick(t.eligibilityText, s.eligibilityText),
    exclusionsText: pick(t.exclusionsText, s.exclusionsText),
    documentsRequired: pick(t.documentsRequired, s.documentsRequired),
    applicationSteps: pick(t.applicationSteps, s.applicationSteps)
  };
};

/**
 * Translates scheme text into the selected language on demand (AI translation of the official
 * English text, cached on the server and in this session). Returns the schemes with translated
 * text overlaid, plus whether any of them is still being translated.
 */
export const useSchemeTranslations = (schemes: Scheme[], mode: TranslationMode) => {
  const { currentLanguage } = useLanguage();
  const lang = currentLanguage.code;
  const [version, setVersion] = useState(0);
  const idsKey = schemes.map((s) => s.schemeId).join(',');

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  useEffect(() => {
    if (lang === 'en' || !idsKey) return;
    const missing = idsKey.split(',').filter((id) => !cache.has(key(lang, mode, id)) && !inFlight.has(key(lang, mode, id)));
    for (let i = 0; i < missing.length; i += BATCH[mode]) {
      fetchBatch(lang, mode, missing.slice(i, i + BATCH[mode]));
    }
  }, [lang, mode, idsKey]);

  const translated = useMemo(
    () => (lang === 'en' ? schemes : schemes.map((s) => merge(s, cache.get(key(lang, mode, s.schemeId))))),
    // version bumps when new translations land; idsKey captures the scheme list
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, mode, idsKey, version]
  );

  const loading = lang !== 'en' && schemes.some((s) => inFlight.has(key(lang, mode, s.schemeId)));
  const isTranslated = (schemeId: string) => lang !== 'en' && cache.has(key(lang, mode, schemeId));

  return { schemes: translated, loading, isTranslated, active: lang !== 'en' };
};
