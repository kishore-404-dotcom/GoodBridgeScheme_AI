import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini API Configuration
 * Initializes Google Generative AI client using process.env.GEMINI_API_KEY
 */
const apiKey = process.env.GEMINI_API_KEY || '';

export const aiClient = apiKey ? new GoogleGenerativeAI(apiKey) : null;

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY not set. Gemini RAG assistant will run using local rule engine fallbacks.');
} else {
  console.log('✅ Gemini API client initialized successfully!');
}
