import { Scheme, UserProfile, EligibilityEvaluationResult, CriterionStatus, DocumentCheckSummary } from '../../../shared/types';
import { checkDocuments, overallMatch } from '../../../shared/documents';

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

    // 7. Social Category (SC / ST / OBC / EWS)
    if (rules.categoriesAllowed && rules.categoriesAllowed.length > 0 && !rules.categoriesAllowed.includes('All')) {
      totalWeight += 20;
      if (rules.categoriesAllowed.includes(profile.category)) {
        metWeight += 20;
        criteriaMet.push({
          criterion: 'Social Category',
          isMet: true,
          details: `Your category (${profile.category}) is eligible.`
        });
      } else {
        criteriaFailed.push({
          criterion: 'Social Category',
          isMet: false,
          details: `Only for ${rules.categoriesAllowed.join(', ')} category. Profile category: ${profile.category}.`
        });
      }
    }

    // 7b. Minority community
    if (rules.minorityRequired) {
      totalWeight += 10;
      if (profile.isMinority) {
        metWeight += 10;
        criteriaMet.push({ criterion: 'Minority', isMet: true, details: 'You belong to a minority community.' });
      } else {
        criteriaFailed.push({ criterion: 'Minority', isMet: false, details: 'Scheme is for minority communities.' });
      }
    }

    // 7c. Education (highest completed level from the guided assessment)
    if (rules.educationAllowed && rules.educationAllowed.length > 0 && profile.education) {
      totalWeight += 15;
      if (rules.educationAllowed.includes(profile.education)) {
        metWeight += 15;
        criteriaMet.push({ criterion: 'Education', isMet: true, details: 'Your education level matches the scheme requirement.' });
      } else {
        criteriaFailed.push({ criterion: 'Education', isMet: false, details: 'Your education level does not match the level this scheme is for.' });
      }
    }

    // 8. Disability
    if (rules.disabilityRequired) {
      totalWeight += 10;
      if (profile.hasDisability) {
        metWeight += 10;
        criteriaMet.push({ criterion: 'Disability', isMet: true, details: 'Person with disability status matches.' });
      } else {
        criteriaFailed.push({ criterion: 'Disability', isMet: false, details: 'Scheme is for persons with benchmark disability.' });
      }
    }

    // 9. Landholding
    if (rules.minLandHoldingAcres !== undefined || rules.maxLandHoldingAcres !== undefined) {
      totalWeight += 10;
      const minLand = rules.minLandHoldingAcres ?? 0;
      const maxLand = rules.maxLandHoldingAcres ?? Infinity;
      const land = profile.landHoldingAcres ?? 0;
      const range = maxLand === Infinity ? `at least ${minLand}` : `${minLand}-${maxLand}`;
      if (land >= minLand && land <= maxLand) {
        metWeight += 10;
        criteriaMet.push({ criterion: 'Landholding', isMet: true, details: `Your landholding (${land} acres) is within ${range} acres.` });
      } else {
        criteriaFailed.push({ criterion: 'Landholding', isMet: false, details: `Landholding must be ${range} acres. Profile: ${land} acres.` });
      }
    }

    // 10. Urban / Rural residence
    if (rules.urbanRural && rules.urbanRural !== 'All' && profile.residenceType && profile.residenceType !== 'All') {
      totalWeight += 10;
      if (profile.residenceType === rules.urbanRural) {
        metWeight += 10;
        criteriaMet.push({ criterion: 'Residence', isMet: true, details: `Scheme applies to ${rules.urbanRural} residents.` });
      } else {
        criteriaFailed.push({ criterion: 'Residence', isMet: false, details: `Only for ${rules.urbanRural} residents. Profile: ${profile.residenceType}.` });
      }
    }

    // Official conditions the checker cannot verify are listed for the citizen to confirm,
    // and cap the score so fully verified matches rank first
    const toConfirm = rules.otherConditions || [];
    if (toConfirm.length > 0) {
      criteriaMet.push({ criterion: 'To confirm', isMet: true, details: `Confirm before applying: ${toConfirm.join('; ')}.` });
    }

    // Calculate Final Match Percentage
    // A scheme with no checkable conditions is open to all, but it is not a verified match,
    // so it ranks below schemes whose conditions the citizen was actually checked against
    const rawScore = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 80;
    const matchScorePercentage = toConfirm.length > 0 ? Math.min(rawScore, 90) : rawScore;
    const isEligible = criteriaFailed.length === 0;

    // Generate Human-friendly Explanation
    const aiSimplifiedExplanation = isEligible
      ? criteriaMet.length > 0
        ? `You qualify for ${scheme.name}! You meet every eligibility condition: ${criteriaMet.map((c) => c.criterion).join(', ')}.`
        : `You qualify for ${scheme.name}! This scheme has no restrictive eligibility conditions.`
      : `You match ${matchScorePercentage}% of criteria for ${scheme.name}. Satisfied: ${criteriaMet.length} conditions. Action needed for: ${criteriaFailed.map((c) => c.criterion).join(', ')}.`;

    // Document check against the documents the citizen declared (only when they were asked)
    let documentReadiness: number | null = null;
    let documentCheck: DocumentCheckSummary | undefined;
    let missingDocuments = scheme.documentsRequired || [];
    if (Array.isArray(profile.documents)) {
      const check = checkDocuments(scheme, profile.documents);
      documentReadiness = check.readiness;
      documentCheck = {
        ready: check.ready.map((l) => l.text),
        missing: check.missing.map((l) => l.text),
        missingTypes: [...new Set(check.missing.map((l) => l.types[0]))],
        optional: check.optional.map((l) => l.text),
        other: check.other.map((l) => l.text)
      };
      missingDocuments = documentCheck.missing;
    }

    return {
      scheme,
      matchScorePercentage,
      isEligible,
      criteriaMet,
      criteriaFailed,
      missingDocuments,
      documentReadiness,
      overallScore: overallMatch(matchScorePercentage, documentReadiness),
      documentCheck,
      aiSimplifiedExplanation
    };
  }
}
