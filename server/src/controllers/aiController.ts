import { Request, Response } from 'express';
import { GeminiAiService } from '../services/geminiAiService';
import { DocumentCheckService } from '../services/documentCheckService';
import { SchemeModel } from '../models/Scheme';
import { VERIFIED_SCHEMES_100 } from '../scripts/seedSchemes';

/**
 * AI & Guidance Controller
 * Handles multilingual Gemini RAG chat and document verification requests.
 */
export class AIController {
  public static async chatAssistant(req: Request, res: Response): Promise<void> {
    try {
      const { message, language = 'English' } = req.body;

      if (!message) {
        res.status(400).json({ success: false, message: 'Message parameter is required' });
        return;
      }

      let schemes = (await SchemeModel.find().lean()) as any[];
      if (!schemes || schemes.length === 0) {
        schemes = VERIFIED_SCHEMES_100 as any[];
      }

      const { responseText, relevantSchemes } = await GeminiAiService.generateVernacularAnswer(message, language, schemes);

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

      let scheme = (await SchemeModel.findOne({ schemeId }).lean()) as any;
      if (!scheme) {
        scheme = VERIFIED_SCHEMES_100.find((s) => s.schemeId === schemeId);
      }

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
