import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController';
import { rateLimit } from '../middleware/rateLimit';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// POST /api/feedback - "Was this helpful?" / "Report wrong information" on a scheme page
router.post('/feedback', rateLimit(20, 60 * 60 * 1000), FeedbackController.submit);

// GET /api/feedback/summary - Feedback counts and open error reports (admin only: messages may contain personal details)
router.get('/feedback/summary', adminOnly, FeedbackController.summary);

// POST /api/stats/event - Anonymous usage counter (search, scheme_view)
router.post('/stats/event', rateLimit(120, 60 * 1000), FeedbackController.trackEvent);

// GET /api/stats - Anonymous usage totals (impact dashboard)
router.get('/stats', FeedbackController.stats);

export default router;
