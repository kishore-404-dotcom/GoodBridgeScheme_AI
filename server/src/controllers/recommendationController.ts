import { Request, Response } from 'express';
import { RuleEngineService } from '../services/ruleEngineService';
import { SchemeStore } from '../services/schemeStore';
import { StatsService } from '../services/statsService';
import { UserProfile, Scheme, EligibilityEvaluationResult } from '../../../shared/types';
import { matchingInterests } from '../../../shared/eligibilityOptions';
import { DOCUMENT_TYPES } from '../../../shared/documents';

const MAX_PARTIAL_MATCHES = 30;

/**
 * Drops the long official texts from a result: the report only needs the summary fields,
 * and the full scheme page loads its own data. Keeps responses and saved reports small.
 */
const slimResult = (r: EligibilityEvaluationResult): EligibilityEvaluationResult => {
  const { detailsText, benefitsText, eligibilityText, exclusionsText, references, ...scheme } = r.scheme;
  return { ...r, scheme: { ...scheme, applicationSteps: [] } };
};

/**
 * Recommendation Controller
 * Runs deterministic Rule Engine against citizen profile to return ranked matches.
 */
export class RecommendationController {
  public static async evaluateProfile(req: Request, res: Response): Promise<void> {
    try {
      // Keep legitimate zeros (e.g. ₹0 income) instead of replacing them with defaults
      const num = (value: unknown, fallback: number): number => {
        const n = Number(value);
        return value === undefined || value === null || value === '' || Number.isNaN(n) ? fallback : n;
      };

      const profile: UserProfile = {
        fullName: req.body.fullName || 'Citizen User',
        age: num(req.body.age, 25),
        gender: req.body.gender || 'All',
        state: req.body.state || 'All India',
        occupation: req.body.occupation || 'General Citizen',
        annualIncome: num(req.body.annualIncome, 250000),
        category: req.body.category || 'General',
        landHoldingAcres: num(req.body.landHoldingAcres, 0),
        hasDisability: Boolean(req.body.hasDisability),
        isBPL: Boolean(req.body.isBPL),
        residenceType: req.body.residenceType || 'All',
        roleId: req.body.roleId,
        incomeBandId: req.body.incomeBandId,
        education: req.body.education,
        isMinority: Boolean(req.body.isMinority),
        interests: Array.isArray(req.body.interests) ? req.body.interests.map(String) : [],
        // Declared documents (types only, nothing uploaded); left undefined when the citizen was not asked
        documents: Array.isArray(req.body.documents)
          ? req.body.documents.map(String).filter((d: string) => (DOCUMENT_TYPES as string[]).includes(d))
          : undefined
      };

      StatsService.track('eligibility_check');
      const schemes = await SchemeStore.getAll();

      const results = schemes.map((scheme: Scheme) => {
        const result = RuleEngineService.evaluateSchemeEligibility(scheme, profile);
        // Interests only rank and explain results; they never change eligibility
        result.matchedInterests = matchingInterests(scheme, profile.interests);
        return result;
      });

      // Sort by overall match (eligibility + documents ready), then interests, then benefit value
      results.sort(
        (a, b) =>
          (b.overallScore ?? b.matchScorePercentage) - (a.overallScore ?? a.matchScorePercentage) ||
          b.matchScorePercentage - a.matchScorePercentage ||
          (b.matchedInterests?.length ?? 0) - (a.matchedInterests?.length ?? 0) ||
          b.scheme.financialBenefitAmount - a.scheme.financialBenefitAmount
      );

      const eligibleOnly = results.filter((r) => r.isEligible);
      // "Almost eligible" = misses exactly one condition, and not because the scheme targets another role
      const partialMatches = results
        .filter((r) => !r.isEligible && r.criteriaFailed.length === 1 && r.criteriaFailed[0].criterion !== 'Occupation')
        .slice(0, MAX_PARTIAL_MATCHES);

      res.status(200).json({
        success: true,
        profile,
        summary: {
          totalEvaluated: results.length,
          totalEligible: eligibleOnly.length,
          totalPartialMatches: partialMatches.length
        },
        eligibleSchemes: eligibleOnly.map(slimResult),
        partialMatches: partialMatches.map(slimResult)
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Eligibility evaluation failed', error });
    }
  }
}
