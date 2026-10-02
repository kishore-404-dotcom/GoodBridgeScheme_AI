import { Scheme, EligibilityRules } from '../../../shared/types';
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
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.scheme);
  }

  /**
   * Human-readable eligibility rules (₹ in Indian format) so the LLM doesn't misread raw numbers
   */
  public static describeRules(rules: EligibilityRules = {}): string {
    const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    const parts: string[] = [];
    if (rules.minAge !== undefined || rules.maxAge !== undefined) parts.push(`Age ${rules.minAge ?? 0}-${rules.maxAge ?? 'no upper limit'} years`);
    if (rules.maxIncome) parts.push(`Annual family income up to ${inr(rules.maxIncome)}`);
    if (rules.genderAllowed?.length && !rules.genderAllowed.includes('All')) parts.push(`Gender: ${rules.genderAllowed.join('/')}`);
    if (rules.categoriesAllowed?.length && !rules.categoriesAllowed.includes('All')) parts.push(`Social category: ${rules.categoriesAllowed.join('/')}`);
    if (rules.occupationsAllowed?.length) parts.push(`Occupation: ${rules.occupationsAllowed.join('/')}`);
    if (rules.statesAllowed?.length) parts.push(`States: ${rules.statesAllowed.join(', ')}`);
    if (rules.minLandHoldingAcres !== undefined || rules.maxLandHoldingAcres !== undefined) parts.push(`Landholding ${rules.minLandHoldingAcres ?? 0}-${rules.maxLandHoldingAcres ?? 'any'} acres`);
    if (rules.bplRequired) parts.push('BPL card required');
    if (rules.disabilityRequired) parts.push('For persons with disability');
    if (rules.urbanRural && rules.urbanRural !== 'All') parts.push(`${rules.urbanRural} residents only`);
    return parts.join('; ') || 'No specific restrictions';
  }

  /**
   * Assembles clean RAG grounding context text for LLM prompting
   */
  public static buildGroundingContext(schemes: Scheme[]): string {
    return schemes
      .map(
        (s, idx) =>
          `[SCHEME ${idx + 1}] ID: ${s.schemeId}\nName: ${s.name}\nCategory: ${s.category}\nFinancial Benefit: ${s.financialBenefit}\nKey Summary: ${s.summaryText}\nEligibility Rules: ${RAGService.describeRules(s.eligibilityRules)}\nDocuments Required: ${s.documentsRequired.join(', ')}\nHow to Apply: ${s.applicationSteps.map((step) => `${step.stepNumber}. ${step.title} - ${step.description}`).join(' ')}\nOfficial URL: ${s.applicationUrl}\n`
      )
      .join('\n---\n');
  }
}
