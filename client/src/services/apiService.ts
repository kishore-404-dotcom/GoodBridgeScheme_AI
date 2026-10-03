import { Scheme, UserProfile, EligibilityEvaluationResult, ApplicationDraft, ChatHistoryTurn } from '../../../shared/types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export type TranslationMode = 'card' | 'full';
/** Translated scheme text from /api/ai/translate; missing fields mean "use the English original" */
export type SchemeTranslation = Partial<
  Pick<Scheme, 'name' | 'ministryOrDepartment' | 'description' | 'summaryText' | 'financialBenefit' | 'tags' | 'detailsText' | 'benefitsText' | 'eligibilityText' | 'exclusionsText' | 'documentsRequired' | 'applicationSteps'>
>;

export type FeedbackType = 'helpful' | 'not_helpful' | 'wrong_info';
export type FeedbackResult = 'saved' | 'unavailable' | 'error';
export const REPORT_REASONS = ['link', 'eligibility', 'benefit', 'documents', 'outdated', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface FeedbackReport {
  _id: string;
  schemeId: string;
  schemeName: string;
  reason?: ReportReason;
  message?: string;
  language?: string;
  resolved: boolean;
  createdAt: string;
}

export interface FeedbackSummary {
  totals: { helpful: number; notHelpful: number; reports: number; openReports: number };
  schemes: { schemeId: string; name: string; total: number; counts: Partial<Record<FeedbackType, number>> }[];
  reports: FeedbackReport[];
}

export interface UsageStats {
  days: number;
  totals: Record<string, number>;
  byDay: { day: string; counts: Record<string, number> }[];
}

/** Admin calls fail with a reason the dashboard can show */
export type AdminResult<T> = { ok: true; data: T } | { ok: false; reason: 'unauthorized' | 'unavailable' | 'error' };

const adminFetch = async <T,>(path: string, token: string, init: RequestInit = {}): Promise<AdminResult<T>> => {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) }
    });
    if (res.status === 401 || res.status === 404) return { ok: false, reason: 'unauthorized' };
    if (res.status === 503) return { ok: false, reason: 'unavailable' };
    if (!res.ok) return { ok: false, reason: 'error' };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, reason: 'error' };
  }
};

export class ApiService {
  /** Citizen feedback on a scheme page; reports carry a reason */
  public static async sendFeedback(schemeId: string, type: FeedbackType, language: string, message?: string, reason?: ReportReason): Promise<FeedbackResult> {
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeId, type, language, message, reason })
      });
      if (res.ok) return 'saved';
      return res.status === 503 ? 'unavailable' : 'error';
    } catch {
      return 'error';
    }
  }

  /** Public "helpful" vote counts for a scheme; null when unavailable */
  public static async getFeedbackScore(schemeId: string): Promise<{ helpful: number; notHelpful: number } | null> {
    try {
      const res = await fetch(`${API_BASE}/feedback/scheme/${encodeURIComponent(schemeId)}`);
      const json = await res.json();
      return json.success && json.available ? { helpful: json.helpful, notHelpful: json.notHelpful } : null;
    } catch {
      return null;
    }
  }

  /** Admin: feedback totals, per-scheme counts and error reports */
  public static getFeedbackSummary(token: string, status: 'open' | 'resolved' | 'all'): Promise<AdminResult<FeedbackSummary>> {
    return adminFetch<FeedbackSummary>(`/feedback/summary?status=${status}`, token);
  }

  /** Admin: mark an error report as resolved, or reopen it */
  public static setReportResolved(token: string, id: string, resolved: boolean): Promise<AdminResult<{ report: FeedbackReport }>> {
    return adminFetch(`/feedback/${encodeURIComponent(id)}`, token, { method: 'PATCH', body: JSON.stringify({ resolved }) });
  }

  /** Anonymous usage totals (public) */
  public static async getUsageStats(days = 30): Promise<UsageStats | null> {
    try {
      const res = await fetch(`${API_BASE}/stats?days=${days}`);
      const json = await res.json();
      return json.success ? (json as UsageStats) : null;
    } catch {
      return null;
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
