import { GoogleGenAI } from '@google/genai';

/**
 * Gemini API Configuration
 * Initializes the Google Gen AI client using process.env.GEMINI_API_KEY
 */
const apiKey = process.env.GEMINI_API_KEY || '';

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// Tried in order when the primary model is overloaded (503) or unavailable
export const GEMINI_FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-flash-lite-latest')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

// Gemini rejects deadlines under 10s
export const GEMINI_TIMEOUT_MS = 10000;

export const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY not set. Assistant will run using local keyword-search fallbacks.');
} else {
  console.log(`✅ Gemini API client initialized (model: ${GEMINI_MODEL})`);
}
