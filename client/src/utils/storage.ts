/**
 * Small localStorage wrapper. Storage can be unavailable (private mode, blocked site data),
 * so every access is guarded and the app keeps working without it.
 */
const PREFIX = 'goodbridge_';

export const readStore = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStore = (key: string, value: unknown): void => {
  try {
    if (value === null || value === undefined) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore: persistence is a convenience only
  }
};
