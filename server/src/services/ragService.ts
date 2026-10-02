import { Scheme, EligibilityRules, SchemeCategory } from '../../../shared/types';

/** Words too common in scheme questions to help ranking */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'any', 'can', 'get', 'how', 'what', 'which', 'who', 'with', 'from', 'that', 'this',
  'there', 'have', 'has', 'need', 'want', 'about', 'tell', 'give', 'show', 'find', 'apply', 'scheme', 'schemes',
  'yojana', 'government', 'govt', 'benefit', 'benefits', 'eligible', 'eligibility', 'documents', 'document',
  'one', 'all', 'some', 'please', 'you', 'your', 'mine', 'me', 'my', 'am', 'is', 'in', 'of', 'to', 'do', 'i'
]);

const MAX_STEP_CHARS = 220;
const MAX_TEXT_CHARS = 350;

const clip = (text: string | undefined, max: number) =>
  !text ? '' : text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

/** Crude English singular so "farmers" matches "Farmer" and "girls" matches "Girl" */
const stem = (term: string) => {
  if (term.length > 4 && term.endsWith('ies')) return `${term.slice(0, -3)}y`;
  if (term.length > 4 && /(ses|xes|ches|shes)$/.test(term)) return term.slice(0, -2);
  if (term.length > 3 && term.endsWith('s') && !term.endsWith('ss')) return term.slice(0, -1);
  return term;
};

/**
 * Question topics. Words are matched as prefixes of the (stemmed) query terms, and a topic
 * lifts schemes in its category, schemes restricted to its occupation, or schemes for women.
 */
const TOPICS: { words: string[]; category: SchemeCategory; occupation?: string; women?: boolean }[] = [
  { words: ['farmer', 'agricultur', 'crop', 'kisan', 'farm', 'irrigat', 'fisher', 'dairy', 'livestock', 'cattle'], category: 'Agriculture / Farmers', occupation: 'Farmer' },
  { words: ['student', 'scholarship', 'school', 'college', 'educat', 'study', 'tuition', 'hostel'], category: 'Student / Education', occupation: 'Student' },
  { words: ['girl', 'woman', 'women', 'female', 'mother', 'daughter', 'widow', 'pregnan', 'maternity', 'mahila', 'kanya'], category: 'Women / Family Welfare', women: true },
  { words: ['loan', 'business', 'entrepreneur', 'startup', 'msme', 'shop', 'vendor', 'artisan', 'self-employ'], category: 'Entrepreneurship / MSME' },
  { words: ['pension', 'senior', 'elderly', 'old', 'aged', 'disab', 'divyang'], category: 'Senior Citizens / Social Welfare' },
  { words: ['job', 'skill', 'training', 'employment', 'unemploy', 'apprentic', 'work'], category: 'Employment / Skill Development' }
];

/**
 * Nationally known schemes that citizens usually mean. They win ties against obscure schemes,
 * but only when the question already matched them.
 */
const FLAGSHIP_IDS = new Set([
  'MS-pm-kisan', 'MS-kcc', 'MS-pmfby', 'MS-pmmy', 'MS-pmkvy-rpl', 'MS-pmmvy', 'MS-nsap-ignoaps', 'MS-ignwps',
  'MS-igndps', 'MS-pmv', 'MS-apy', 'MS-pmjjby', 'MS-pmsby', 'MS-pm-sym', 'MS-pmuy2', 'MS-pm-svanidhi',
  'MS-wbkanyashree', 'MS-lbs-wb'
]);

/**
 * Retrieval over the scheme catalogue.
 * The catalogue is far too large to send to the LLM whole, so every chat request
 * is grounded on a small, relevant subset chosen here.
 */
export class RAGService {
  /**
   * Keyword retrieval weighted by where the term appears (title > tags > text), plus question
   * topics and a small boost for flagship schemes.
   * When `state` is given, state-level schemes from other states are skipped.
   */
  public static retrieveRelevantSchemes(
    query: string,
    allSchemes: Scheme[],
    topK = 5,
    opts: { state?: string } = {}
  ): Scheme[] {
    const qLower = query.toLowerCase();
    const terms = [...new Set(qLower.split(/[^\p{L}\p{N}-]+/u))]
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
      .map(stem)
      .filter((t) => !STOPWORDS.has(t));
    const topics = TOPICS.filter((topic) => terms.some((t) => topic.words.some((w) => t.startsWith(w))));
    if (terms.length === 0 && topics.length === 0) return [];

    const scored = allSchemes
      .filter((s) => !opts.state || s.level !== 'State' || !s.state || s.state === opts.state)
      .map((scheme) => {
        const title = `${scheme.name} ${scheme.shortTitle || ''}`.toLowerCase();
        const tags = `${scheme.tags.join(' ')} ${scheme.category}`.toLowerCase();
        const text = `${scheme.description} ${scheme.summaryText} ${scheme.financialBenefit}`.toLowerCase();
        const rules = scheme.eligibilityRules || {};

        let score = 0;
        for (const term of terms) {
          if (title.includes(term)) score += 25;
          if (tags.includes(term)) score += 15;
          if (text.includes(term)) score += 5;
        }
        for (const topic of topics) {
          if (scheme.category === topic.category) score += 20;
          if (topic.occupation && rules.occupationsAllowed?.includes(topic.occupation)) score += 15;
          if (topic.women && rules.genderAllowed?.includes('Female') && !rules.genderAllowed.includes('All')) score += 25;
        }
        // A scheme named in full (e.g. in the previous answer) is almost certainly the one meant
        if (scheme.shortTitle && scheme.shortTitle.length > 2 && qLower.includes(scheme.shortTitle.toLowerCase())) score += 60;
        if (qLower.includes(scheme.name.toLowerCase())) score += 60;
        if (score > 0 && FLAGSHIP_IDS.has(scheme.schemeId)) score += 20;
        if (score > 0 && opts.state && scheme.state === opts.state) score += 10;

        return { scheme, score };
      });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.scheme.level === 'Central' ? -1 : 1))
      .slice(0, topK)
      .map((item) => item.scheme);
  }

  /**
   * Used when a question matches nothing: the citizen's state schemes and the flagship
   * central schemes, so the assistant always has something real to work with.
   */
  public static defaultSchemes(allSchemes: Scheme[], topK: number, state?: string): Scheme[] {
    const flagships = allSchemes.filter((s) => FLAGSHIP_IDS.has(s.schemeId) && s.level === 'Central');
    const stateSchemes = state ? allSchemes.filter((s) => s.state === state).slice(0, Math.ceil(topK / 2)) : [];
    return [...stateSchemes, ...flagships].slice(0, topK);
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
    if (rules.educationAllowed?.length) parts.push(`Education: ${rules.educationAllowed.join('/')}`);
    if (rules.minLandHoldingAcres !== undefined || rules.maxLandHoldingAcres !== undefined) parts.push(`Landholding ${rules.minLandHoldingAcres ?? 0}-${rules.maxLandHoldingAcres ?? 'any'} acres`);
    if (rules.bplRequired) parts.push('BPL card required');
    if (rules.disabilityRequired) parts.push('For persons with disability');
    if (rules.minorityRequired) parts.push('For minority communities');
    if (rules.urbanRural && rules.urbanRural !== 'All') parts.push(`${rules.urbanRural} residents only`);
    if (rules.otherConditions?.length) parts.push(`Also: ${rules.otherConditions.join('; ')}`);
    return parts.join('; ') || 'No specific restrictions';
  }

  /**
   * Compact grounding text for the LLM. Long official texts are clipped to keep each
   * request small; the full details stay on the scheme page.
   */
  public static buildGroundingContext(schemes: Scheme[]): string {
    return schemes
      .map((s, idx) => {
        const steps = s.applicationSteps
          .slice(0, 5)
          .map((step) => `${step.stepNumber}. ${clip(step.description || step.title, MAX_STEP_CHARS)}`)
          .join(' ');
        return [
          `[SCHEME ${idx + 1}] ID: ${s.schemeId}`,
          `Name: ${s.name}${s.shortTitle ? ` (${s.shortTitle})` : ''}`,
          `Level: ${s.level}${s.state ? ` - ${s.state}` : ''} | Category: ${s.category}`,
          `Financial Benefit: ${clip(s.financialBenefit, MAX_TEXT_CHARS)}`,
          `Key Summary: ${clip(s.summaryText, MAX_TEXT_CHARS)}`,
          `Eligibility Rules: ${RAGService.describeRules(s.eligibilityRules)}`,
          `Documents Required: ${s.documentsRequired.slice(0, 10).join(', ')}`,
          `How to Apply: ${steps}`,
          `Official URL: ${s.applicationUrl}`
        ].join('\n');
      })
      .join('\n---\n');
  }
}
