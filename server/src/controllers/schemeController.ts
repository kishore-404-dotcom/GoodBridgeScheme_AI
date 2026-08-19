import { Request, Response } from 'express';
import { SchemeModel } from '../models/Scheme';
import { VERIFIED_SCHEMES_100 } from '../scripts/seedSchemes';

/**
 * Scheme Controller
 * Handles retrieval of schemes, filtering by category/state/search, and scheme details.
 */
export class SchemeController {
  public static async getAllSchemes(req: Request, res: Response): Promise<void> {
    try {
      const { category, state, search, level } = req.query;

      let schemes = await SchemeModel.find().lean();
      if (!schemes || schemes.length === 0) {
        schemes = VERIFIED_SCHEMES_100 as any;
      }

      let filtered = [...schemes];

      if (category && category !== 'All') {
        filtered = filtered.filter((s) => s.category.toLowerCase().includes(String(category).toLowerCase()));
      }

      if (state && state !== 'All India') {
        filtered = filtered.filter((s) => s.eligibilityRules?.statesAllowed?.includes(String(state)) || s.eligibilityRules?.statesAllowed?.includes('All India'));
      }

      if (level) {
        filtered = filtered.filter((s) => s.level === level);
      }

      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)));
      }

      res.status(200).json({
        success: true,
        count: filtered.length,
        data: filtered
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch schemes', error });
    }
  }

  public static async getSchemeById(req: Request, res: Response): Promise<void> {
    try {
      const { schemeId } = req.params;
      let scheme = await SchemeModel.findOne({ schemeId }).lean();

      if (!scheme) {
        scheme = (VERIFIED_SCHEMES_100.find((s) => s.schemeId === schemeId) as any) || null;
      }

      if (!scheme) {
        res.status(404).json({ success: false, message: 'Scheme not found' });
        return;
      }

      res.status(200).json({ success: true, data: scheme });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch scheme details', error });
    }
  }
}
