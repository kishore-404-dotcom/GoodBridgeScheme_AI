import { Scheme, UserProfile, EligibilityEvaluationResult, ApplicationDraft } from '../../../shared/types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export class ApiService {
  public static async fetchSchemes(params?: { category?: string; state?: string; search?: string }): Promise<Scheme[]> {
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/schemes?${query}`);
      const json = await res.json();
      if (json.success) return json.data;
    } catch (err) {
      console.warn('Backend API fetch error, using local fallback:', err);
    }
    return [];
  }

  public static async fetchSchemeById(schemeId: string): Promise<Scheme | null> {
    try {
      const res = await fetch(`${API_BASE}/schemes/${schemeId}`);
      const json = await res.json();
      if (json.success) return json.data;
    } catch (err) {
      console.warn('Backend API fetch by ID error:', err);
    }
    return null;
  }

  public static async evaluateEligibility(profile: UserProfile): Promise<{
    eligibleSchemes: EligibilityEvaluationResult[];
    partialMatches: EligibilityEvaluationResult[];
    allEvaluations: EligibilityEvaluationResult[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/recommendations/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const json = await res.json();
      if (json.success) {
        return {
          eligibleSchemes: json.eligibleSchemes,
          partialMatches: json.partialMatches,
          allEvaluations: json.allEvaluations
        };
      }
    } catch (err) {
      console.warn('Backend evaluation API error:', err);
    }
    return { eligibleSchemes: [], partialMatches: [], allEvaluations: [] };
  }

  public static async sendChatMessage(message: string, language: string): Promise<{
    assistantResponse: string;
    suggestedSchemes: Scheme[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });
      const json = await res.json();
      if (json.success) {
        return {
          assistantResponse: json.assistantResponse,
          suggestedSchemes: json.suggestedSchemes || []
        };
      }
    } catch (err) {
      console.warn('Backend AI Chat API error:', err);
    }
    return {
      assistantResponse: `Thank you for reaching out to GoodSchemeAI in ${language}. Please check the eligibility module above to get instant matches!`,
      suggestedSchemes: []
    };
  }

  public static async generateDraft(schemeId: string, applicantName: string, language: string): Promise<ApplicationDraft | null> {
    try {
      const res = await fetch(`${API_BASE}/ai/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeId, applicantName, language })
      });
      const json = await res.json();
      if (json.success) return json.draft;
    } catch (err) {
      console.warn('Backend Draft API error:', err);
    }
    return null;
  }
}
