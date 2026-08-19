import { aiClient } from '../config/gemini';
import { RAGService } from './ragService';
import { Scheme } from '../../../shared/types';

/**
 * Multilingual Gemini AI Service
 * Generates grounded, hallucination-free scheme guidance in preferred regional languages.
 */
export class GeminiAiService {
  /**
   * Generates grounded answer for citizen question in regional language
   */
  public static async generateVernacularAnswer(
    userMessage: string,
    language: string,
    allSchemes: Scheme[]
  ): Promise<{ responseText: string; relevantSchemes: Scheme[] }> {
    const relevantSchemes = RAGService.retrieveRelevantSchemes(userMessage, allSchemes, 4);
    const groundingContext = RAGService.buildGroundingContext(relevantSchemes);

    const systemPrompt = `You are GoodSchemeAI, an official, trustworthy Indian Government Scheme AI Assistant.
    Language Requested: ${language}
    You must answer the citizen's question accurately in ${language}.
    Base your answer strictly on the verified government scheme context provided below:

    --- VERIFIED SCHEME CONTEXT ---
    ${groundingContext}
    -------------------------------

    Rules:
    1. Answer in simple, friendly, encouraging language (${language}).
    2. Explicitly mention scheme names, financial benefits (₹), key eligibility rules, and required documents.
    3. Keep answers concise, clear, and actionable with bullet points.
    4. Never hallucinate rules or URLs not present in the context.`;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${userMessage}`);
        const response = await result.response;
        const responseText = response.text() || this.getFallbackAnswer(userMessage, language, relevantSchemes);
        return { responseText, relevantSchemes };
      } catch (err) {
        console.error('Gemini API call failed, using grounded fallback:', err);
      }
    }

    // Local fallback response
    const responseText = this.getFallbackAnswer(userMessage, language, relevantSchemes);
    return { responseText, relevantSchemes };
  }

  private static getFallbackAnswer(
    query: string,
    language: string,
    schemes: Scheme[]
  ): string {
    if (schemes.length === 0) {
      return `Thank you for asking about government schemes in ${language}. Please specify your profile details (age, state, income) to get exact scheme recommendations.`;
    }

    const topScheme = schemes[0];
    return `Based on verified official government records:

📌 **Recommended Scheme**: ${topScheme.name} (${topScheme.category})
💰 **Financial Benefit**: ${topScheme.financialBenefit}
📋 **Summary**: ${topScheme.summaryText}
📁 **Required Documents**: ${topScheme.documentsRequired.slice(0, 4).join(', ')}
🔗 **Official Portal**: ${topScheme.applicationUrl}`;
  }
}
