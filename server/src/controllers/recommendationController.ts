import { Request, Response } from 'express';
import { RuleEngineService } from '../services/ruleEngineService';
import { SchemeModel } from '../models/Scheme';
import { VERIFIED_SCHEMES_100 } from '../scripts/seedSchemes';
import { UserProfile, Scheme } from '../../../shared/types';

/**
 * Recommendation Controller
 * Runs deterministic Rule Engine against citizen profile to return ranked matches.
 */
export class RecommendationController {
  public static async evaluateProfile(req: Request, res: Response): Promise<void> {
    try {
      const profile: UserProfile = {
        fullName: req.body.fullName || 'Citizen User',
        age: Number(req.body.age) || 25,
        gender: req.body.gender || 'All',
        state: req.body.state || 'All India',
        occupation: req.body.occupation || 'General Citizen',
        annualIncome: Number(req.body.annualIncome) || 250000,
        category: req.body.category || 'General',
        landHoldingAcres: Number(req.body.landHoldingAcres) || 0,
        hasDisability: Boolean(req.body.hasDisability),
        isBPL: Boolean(req.body.isBPL),
        residenceType: req.body.residenceType || 'All'
      };

      let schemes = (await SchemeModel.find().lean()) as any[];
      if (!schemes || schemes.length === 0) {
        schemes = VERIFIED_SCHEMES_100 as any[];
      }

      const results = schemes.map((scheme: Scheme) => RuleEngineService.evaluateSchemeEligibility(scheme, profile));

      // Sort by matchScorePercentage descending, then financialBenefitAmount
      results.sort((a, b) => b.matchScorePercentage - a.matchScorePercentage || b.scheme.financialBenefitAmount - a.scheme.financialBenefitAmount);

      const eligibleOnly = results.filter((r) => r.isEligible);
      const partialMatches = results.filter((r) => !r.isEligible && r.matchScorePercentage >= 50);

      res.status(200).json({
        success: true,
        profile,
        summary: {
          totalEvaluated: results.length,
          totalEligible: eligibleOnly.length,
          totalPartialMatches: partialMatches.length
        },
        eligibleSchemes: eligibleOnly,
        partialMatches,
        allEvaluations: results
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Eligibility evaluation failed', error });
    }
  }
}
