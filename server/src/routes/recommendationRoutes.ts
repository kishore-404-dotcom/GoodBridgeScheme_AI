import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';

const router = Router();

// POST /api/recommendations/evaluate - Evaluates citizen profile against rule engine
router.post('/evaluate', RecommendationController.evaluateProfile);

export default router;
