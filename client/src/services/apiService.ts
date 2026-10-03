import { Scheme, UserProfile, EligibilityEvaluationResult, ApplicationDraft, ChatHistoryTurn } from '../../../shared/types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export type TranslationMode = 'card' | 'full';
/** Translated scheme text from /api/ai/translate; missing fields mean "use the English original" */
export type SchemeTranslation = Partial<
  Pick<Scheme, 'name' | 'ministryOrDepartment' | 'description' | 'summaryText' | 'financialBenefit' | 'tags' | 'detailsText' | 'benefitsText' | 'eligibilityText' | 'exclusionsText' | 'documentsRequired' | 'applicationSteps'>
>;

export type FeedbackType = 'helpful' | 'not_helpful' | 'wrong_info';
export type FeedbackResult = 'saved' | 'unavailable' | 'error';

export class ApiService {
  /** Citizen feedback on a scheme page */
  public static async sendFeedback(schemeId: string, type: FeedbackType, language: string, message?: string): Promise<FeedbackResult> {
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeId, type, language, message })
      });
      if (res.ok) return 'saved';
      return res.status === 503 ? 'unavailable' : 'error';
    } catch {
      return 'error';
    }
  }

  /** Anonymous usage counter (fire and forget; never blocks the page) */
  public static trackEvent(event: 'search' | 'scheme_view', language: string): void {
    try {
      fetch(`${API_BASE}/stats/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, language }),
        keepalive: true
      }).catch(() => undefined);
    } catch {
      // Tracking must never affect the user
    }
  }

  /** AI translation of official scheme text; returns {} on failure so callers fall back to English */
  public static async translateSchemes(language: string, schemeIds: string[], mode: TranslationMode): Promise<Record<string, SchemeTranslation>> {
    try {
      const res = await fetch(`${API_BASE}/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, schemeIds, mode })
      });
      const json = await res.json();
      if (json.success) return json.translations || {};
    } catch (err) {
      console.warn('Translation API error:', err);
    }
    return {};
  }

  /** Server-generated speech (WAV) for languages the browser has no voice for; null on failure */
  public static async textToSpeech(text: string, language: string, signal?: AbortSignal): Promise<Blob | null> {
    try {
      const res = await fetch(`${API_BASE}/ai/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
        signal
      });
      if (res.ok && (res.headers.get('content-type') || '').includes('audio')) return await res.blob();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.warn('Voice API error:', err);
    }
    return null;
  }

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

  /** Returns null when the server could not evaluate, so the UI can show an error instead of "0 matches" */
  public static async evaluateEligibility(profile: UserProfile): Promise<{
    eligibleSchemes: EligibilityEvaluationResult[];
    partialMatches: EligibilityEvaluationResult[];
  } | null> {
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
          partialMatches: json.partialMatches
        };
      }
    } catch (err) {
      console.warn('Backend evaluation API error:', err);
    }
    return null;
  }

  public static async sendChatMessage(
    message: string,
    language: string,
    history: ChatHistoryTurn[] = [],
    profile?: UserProfile
  ): Promise<{
    assistantResponse: string;
    suggestedSchemes: Scheme[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language, history, profile })
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
      assistantResponse: '⚠️ Sorry, I could not reach the GoodBridgeScheme AI server. Please check your connection and try again, or use the eligibility checker on this page.',
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
