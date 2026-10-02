import { Request, Response } from 'express';
import { GeminiAiService } from '../services/geminiAiService';
import { DocumentCheckService } from '../services/documentCheckService';
import { SchemeStore } from '../services/schemeStore';

/**
 * AI & Guidance Controller
 * Handles multilingual Gemini RAG chat and document verification requests.
 */
export class AIController {
  public static async chatAssistant(req: Request, res: Response): Promise<void> {
    try {
      const { message, language = 'English', history = [], profile } = req.body;

      if (!message) {
        res.status(400).json({ success: false, message: 'Message parameter is required' });
        return;
      }

      const schemes = await SchemeStore.getAll();

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
