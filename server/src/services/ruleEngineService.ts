import { Scheme, UserProfile, EligibilityEvaluationResult, CriterionStatus } from '../../../shared/types';

/**
 * Deterministic TypeScript Rule Engine
 * Evaluates a citizen profile against a scheme's eligibility criteria.
 * Computes exact match score (0-100%), met/failed criteria list, missing docs, and simplified explanation.
 */
export class RuleEngineService {
  public static evaluateSchemeEligibility(
    scheme: Scheme,
    profile: UserProfile
  ): EligibilityEvaluationResult {
    const rules = scheme.eligibilityRules || {};
    const criteriaMet: CriterionStatus[] = [];
    const criteriaFailed: CriterionStatus[] = [];

    let totalWeight = 0;
    let metWeight = 0;

    // 1. Age Evaluation
    if (rules.minAge !== undefined || rules.maxAge !== undefined) {
      totalWeight += 20;
      const min = rules.minAge ?? 0;
      const max = rules.maxAge ?? 120;
      const isAgeValid = profile.age >= min && profile.age <= max;

      if (isAgeValid) {
        metWeight += 20;
        criteriaMet.push({
          criterion: 'Age Criteria',
          isMet: true,
          details: `Your age (${profile.age} yrs) satisfies the requirement (${min}-${max} yrs).`
        });
      } else {
        criteriaFailed.push({
          criterion: 'Age Criteria',
          isMet: false,
          details: `Age required is ${min}-${max} yrs. Current profile age: ${profile.age} yrs.`
        });
      }
    }

    // 2. Annual Income Evaluation
    if (rules.maxIncome !== undefined && rules.maxIncome > 0) {
      totalWeight += 25;
      const isIncomeValid = profile.annualIncome <= rules.maxIncome;

      if (isIncomeValid) {
        metWeight += 25;
        criteriaMet.push({
          criterion: 'Income Cap',
          isMet: true,
          details: `Your annual income (₹${profile.annualIncome.toLocaleString('en-IN')}) is below the ₹${rules.maxIncome.toLocaleString('en-IN')} limit.`
        });
      } else {
        criteriaFailed.push({
          criterion: 'Income Cap',
          isMet: false,
          details: `Maximum annual income allowed is ₹${rules.maxIncome.toLocaleString('en-IN')}. Profile income: ₹${profile.annualIncome.toLocaleString('en-IN')}.`
        });
      }
    }

    // 3. Gender Evaluation
    if (rules.genderAllowed && rules.genderAllowed.length > 0 && !rules.genderAllowed.includes('All')) {
      totalWeight += 15;
      const isGenderValid = rules.genderAllowed.includes(profile.gender);

      if (isGenderValid) {
        metWeight += 15;
        criteriaMet.push({
          criterion: 'Target Gender',
          isMet: true,
          details: `Target gender (${rules.genderAllowed.join(', ')}) matches profile (${profile.gender}).`
        });
      } else {
        criteriaFailed.push({
          criterion: 'Target Gender',
          isMet: false,
          details: `Scheme target gender is ${rules.genderAllowed.join(', ')}. Profile is ${profile.gender}.`
        });
      }
    }

    // 4. State / Location Evaluation
    if (rules.statesAllowed && rules.statesAllowed.length > 0 && !rules.statesAllowed.includes('All India')) {
      totalWeight += 15;
      const isStateValid = rules.statesAllowed.includes(profile.state) || rules.statesAllowed.includes('All India');

      if (isStateValid) {
        metWeight += 15;
        criteriaMet.push({
          criterion: 'State Domicile',
          isMet: true,
          details: `Scheme applies in ${profile.state}.`
        });
      } else {
        criteriaFailed.push({
          criterion: 'State Domicile',
          isMet: false,
          details: `Available in ${rules.statesAllowed.join(', ')}. Profile state: ${profile.state}.`
        });
      }
    }

    // 5. Occupation & Landholding Evaluation
    if (rules.occupationsAllowed && rules.occupationsAllowed.length > 0 && !rules.occupationsAllowed.includes('All')) {
      totalWeight += 15;
      const isOccupationValid =
        rules.occupationsAllowed.includes(profile.occupation) ||
        rules.occupationsAllowed.includes('All Citizens');

      if (isOccupationValid) {
        metWeight += 15;
        criteriaMet.push({
          criterion: 'Occupation',
          isMet: true,
          details: `Occupation (${profile.occupation}) matches scheme criteria.`
        });
      } else {
        criteriaFailed.push({
          criterion: 'Occupation',
          isMet: false,
          details: `Eligible occupations: ${rules.occupationsAllowed.join(', ')}. Profile: ${profile.occupation}.`
        });
      }
    }

    // 6. Special Category (BPL / Disability)
    if (rules.bplRequired) {
      totalWeight += 10;
      if (profile.isBPL) {
        metWeight += 10;
        criteriaMet.push({
          criterion: 'BPL Status',
          isMet: true,
          details: 'Below Poverty Line status verified.'
        });
      } else {
        criteriaFailed.push({
          criterion: 'BPL Status',
          isMet: false,
          details: 'BPL Card / Ration status required.'
        });
      }
    }

    // Calculate Final Match Percentage
    const matchScorePercentage = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 100;
    const isEligible = criteriaFailed.length === 0;

    // Generate Human-friendly Explanation
    const aiSimplifiedExplanation = isEligible
      ? `You qualify 100% for ${scheme.name}! You meet all ${criteriaMet.length} eligibility criteria including age, income, and category.`
      : `You match ${matchScorePercentage}% of criteria for ${scheme.name}. Satisfied: ${criteriaMet.length} conditions. Action needed for: ${criteriaFailed.map((c) => c.criterion).join(', ')}.`;

    return {
      scheme,
      matchScorePercentage,
      isEligible,
      criteriaMet,
      criteriaFailed,
      missingDocuments: scheme.documentsRequired || [],
      aiSimplifiedExplanation
    };
  }
}
