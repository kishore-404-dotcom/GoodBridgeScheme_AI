import { Request, Response } from 'express';
import { GeminiAiService } from '../services/geminiAiService';
import { DocumentCheckService } from '../services/documentCheckService';
import { SchemeStore } from '../services/schemeStore';
import { TranslationService, TranslationMode, TRANSLATION_LANGUAGES } from '../services/translationService';
import { TtsService, MAX_TTS_CHARS } from '../services/ttsService';
import { StatsService } from '../services/statsService';

const MAX_TRANSLATE_IDS = { card: 30, full: 3 };

/**
 * AI & Guidance Controller
 * Handles multilingual Gemini RAG chat and document verification requests.
 */
export class AIController {
  /** POST /api/ai/translate { language: 'ta', schemeIds: [...], mode: 'card' | 'full' } */
  public static async translateSchemes(req: Request, res: Response): Promise<void> {
    try {
      const { language, schemeIds, mode = 'card' } = req.body || {};
      if (!TranslationService.isSupported(language) || !Array.isArray(schemeIds) || !['card', 'full'].includes(mode)) {
        res.status(400).json({ success: false, message: 'language, schemeIds[] and mode (card|full) are required' });
        return;
      }
      const ids = [...new Set(schemeIds.map(String))].slice(0, MAX_TRANSLATE_IDS[mode as TranslationMode]);
      const all = await SchemeStore.getAll();
      const schemes = ids.map((id) => all.find((s) => s.schemeId === id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
      const translations = await TranslationService.translate(schemes, language, mode as TranslationMode);
      StatsService.track('translation', language);
      res.status(200).json({ success: true, language, mode, translations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Translation failed' });
    }
  }

  /** POST /api/ai/tts { text, language: 'ta' } -> audio/wav */
  public static async textToSpeech(req: Request, res: Response): Promise<void> {
    try {
      const { text, language } = req.body || {};
      const languageName = language === 'en' ? 'English' : TRANSLATION_LANGUAGES[language];
      if (!text || typeof text !== 'string' || !languageName) {
        res.status(400).json({ success: false, message: 'text and a supported language are required' });
        return;
      }
      if (!TtsService.isAvailable()) {
        res.status(503).json({ success: false, message: 'Voice generation is not configured' });
        return;
      }
      const audio = await TtsService.synthesize(text.slice(0, MAX_TTS_CHARS), languageName);
      StatsService.track('voice', language);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(audio);
    } catch (error) {
      res.status(502).json({ success: false, message: 'Voice generation failed' });
    }
  }

  public static async chatAssistant(req: Request, res: Response): Promise<void> {
    try {
      const { message, language = 'English', history = [], profile } = req.body;

      if (!message) {
        res.status(400).json({ success: false, message: 'Message parameter is required' });
        return;
      }

      const schemes = await SchemeStore.getAll();

      // Chat sends the language name ("Tamil"); stats use the code ("ta")
      const langCode = language === 'English' ? 'en' : Object.entries(TRANSLATION_LANGUAGES).find(([, name]) => name === language)?.[0];
      StatsService.track('chat', langCode);
      const { responseText, relevantSchemes } = await GeminiAiService.generateVernacularAnswer(
        message,
        language,
        schemes,
        Array.isArray(history) ? history : [],
        profile && typeof profile === 'object' ? profile : undefined
      );

      res.status(200).json({
        success: true,
        userMessage: message,
        language,
        assistantResponse: responseText,
        suggestedSchemes: relevantSchemes
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'AI Chat processing failed', error });
    }
  }

  public static async generateDraft(req: Request, res: Response): Promise<void> {
    try {
      const { schemeId, applicantName = 'Citizen Applicant', language = 'English', profileData = {} } = req.body;

      const scheme = await SchemeStore.getById(schemeId);

      if (!scheme) {
        res.status(404).json({ success: false, message: 'Scheme not found' });
        return;
      }

      const draft = DocumentCheckService.generateApplicationDraft(scheme, applicantName, language, profileData);

      res.status(200).json({
        success: true,
        draft
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Draft generation failed', error });
    }
  }
}
