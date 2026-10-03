/**
 * Remembers Gemini models that are temporarily unusable so requests skip them instead of
 * failing on them first every time (a free-tier model that has used its daily quota keeps
 * returning 429 until the quota resets).
 */
const unavailableUntil = new Map<string, number>();

const MINUTE = 60_000;
const DEFAULT_QUOTA_COOLDOWN = 60 * MINUTE;
const MAX_QUOTA_COOLDOWN = 24 * 60 * MINUTE;
const OVERLOAD_COOLDOWN = 2 * MINUTE;

/** Reads Google's suggested wait ("retryDelay":"69686s") from an error message, in ms */
const retryDelayMs = (message: string): number | null => {
  const m = message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/) || message.match(/retry in (\d+(?:\.\d+)?)s/i);
  return m ? Math.ceil(Number(m[1]) * 1000) : null;
};

/** Records a failure; quota and overload errors put the model on a cooldown */
export const reportModelFailure = (model: string, err: unknown): void => {
  const message = String((err as Error)?.message || err);
  let cooldown = 0;
  if (/RESOURCE_EXHAUSTED|"code":\s*429|\b429\b/.test(message)) {
    cooldown = Math.min(retryDelayMs(message) ?? DEFAULT_QUOTA_COOLDOWN, MAX_QUOTA_COOLDOWN);
  } else if (/UNAVAILABLE|"code":\s*503|overloaded|high demand/i.test(message)) {
    cooldown = OVERLOAD_COOLDOWN;
  } else if (/NOT_FOUND|"code":\s*404|no longer available/i.test(message)) {
    cooldown = MAX_QUOTA_COOLDOWN;
  }
  if (cooldown > 0) {
    unavailableUntil.set(model, Date.now() + cooldown);
    console.warn(`⏸️  Skipping ${model} for ${Math.round(cooldown / MINUTE)} min (${/429|RESOURCE_EXHAUSTED/.test(message) ? 'quota used up' : 'unavailable'})`);
  }
};

export const isModelAvailable = (model: string): boolean => (unavailableUntil.get(model) ?? 0) <= Date.now();

/**
 * Models in preference order with cooled-down ones removed. If every model is cooling down,
 * returns the one that recovers soonest so the request still gets a chance.
 */
export const usableModels = (models: string[]): string[] => {
  const unique = [...new Set(models)];
  const ready = unique.filter(isModelAvailable);
  if (ready.length > 0) return ready;
  const soonest = [...unique].sort((a, b) => (unavailableUntil.get(a) ?? 0) - (unavailableUntil.get(b) ?? 0))[0];
  return soonest ? [soonest] : [];
};
