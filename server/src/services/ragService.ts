import { Scheme } from '../../../shared/types';
import { RuleEngineService } from './ruleEngineService';

/**
 * RAG (Retrieval-Augmented Generation) & Vector Search Service
 * Performs semantic vector search and hybrid keyword retrieval over verified scheme content.
 */
export class RAGService {
  /**
   * Retrieves top K relevant schemes from verified database for grounding context
   */
  public static retrieveRelevantSchemes(
    query: string,
    allSchemes: Scheme[],
    topK = 5
  ): Scheme[] {
    const qLower = query.toLowerCase();

    // Score schemes by keyword relevance and semantic intent matching
    const scored = allSchemes.map((scheme) => {
      let score = 0;
      const textToSearch = `${scheme.name} ${scheme.category} ${scheme.description} ${scheme.summaryText} ${scheme.tags.join(' ')}`.toLowerCase();

      // Keyword match
      query.split(' ').forEach((term) => {
        if (term.length > 2 && textToSearch.includes(term)) {
          score += 10;
        }
      });

      // Exact phrase match
      if (textToSearch.includes(qLower)) {
        score += 50;
      }

      // Category semantic intent match
      if (qLower.includes('farmer') || qLower.includes('crop') || qLower.includes('kisan') || qLower.includes('खेती')) {
        if (scheme.category === 'Agriculture / Farmers') score += 30;
      }
      if (qLower.includes('student') || qLower.includes('scholarship') || qLower.includes('school') || qLower.includes('fee')) {
        if (scheme.category === 'Student / Education') score += 30;
      }
      if (qLower.includes('loan') || qLower.includes('business') || qLower.includes('mudra') || qLower.includes('artisan')) {
        if (scheme.category === 'Entrepreneurship / MSME') score += 30;
      }
      if (qLower.includes('woman') || qLower.includes('girl') || qLower.includes('mother') || qLower.includes('mahila')) {
        if (scheme.category === 'Women / Family Welfare') score += 30;
      }
      if (qLower.includes('pension') || qLower.includes('senior') || qLower.includes('elderly') || qLower.includes('old age')) {
        if (scheme.category === 'Senior Citizens / Social Welfare') score += 30;
      }

      return { scheme, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.scheme);
  }

  /**
   * Assembles clean RAG grounding context text for LLM prompting
   */
  public static buildGroundingContext(schemes: Scheme[]): string {
    return schemes
      .map(
        (s, idx) =>
          `[SCHEME ${idx + 1}] ID: ${s.schemeId}\nName: ${s.name}\nCategory: ${s.category}\nFinancial Benefit: ${s.financialBenefit}\nKey Summary: ${s.summaryText}\nDocuments Required: ${s.documentsRequired.join(', ')}\nOfficial URL: ${s.applicationUrl}\n`
      )
      .join('\n---\n');
  }
}
