import { Request, Response } from 'express';
import { FeedbackModel, FEEDBACK_TYPES, FeedbackType } from '../models/Feedback';
import { isDatabaseConnected } from '../config/database';
import { SchemeStore } from '../services/schemeStore';
import { StatsService, TRACKED_EVENTS, TrackedEvent } from '../services/statsService';

/** Events the website itself may report (server-side events are tracked where they happen) */
const CLIENT_EVENTS: TrackedEvent[] = ['search', 'scheme_view'];

export class FeedbackController {
  /** POST /api/feedback { schemeId, type: helpful | not_helpful | wrong_info, message?, language? } */
  public static async submit(req: Request, res: Response): Promise<void> {
    const { schemeId, type, message, language } = req.body || {};
    if (typeof schemeId !== 'string' || !FEEDBACK_TYPES.includes(type)) {
      res.status(400).json({ success: false, message: 'schemeId and a valid type are required' });
      return;
    }
    if (!(await SchemeStore.getById(schemeId))) {
      res.status(404).json({ success: false, message: 'Unknown scheme' });
      return;
    }
    if (!isDatabaseConnected()) {
      res.status(503).json({ success: false, message: 'Feedback is unavailable right now. Please try again later.' });
      return;
    }
    try {
      await FeedbackModel.create({
        schemeId,
        type: type as FeedbackType,
        message: typeof message === 'string' ? message.trim().slice(0, 1000) : undefined,
        language: typeof language === 'string' ? language.slice(0, 5) : undefined
      });
      StatsService.track('feedback', typeof language === 'string' ? language : undefined);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Could not save feedback' });
    }
  }

  /** GET /api/feedback/summary: counts per scheme and the latest unresolved error reports */
  public static async summary(_req: Request, res: Response): Promise<void> {
    if (!isDatabaseConnected()) {
      res.status(503).json({ success: false, message: 'Database not connected' });
      return;
    }
    const [counts, reports] = await Promise.all([
      FeedbackModel.aggregate([
        { $group: { _id: { schemeId: '$schemeId', type: '$type' }, count: { $sum: 1 } } },
        { $group: { _id: '$_id.schemeId', counts: { $push: { k: '$_id.type', v: '$count' } } } },
        { $project: { _id: 0, schemeId: '$_id', counts: { $arrayToObject: '$counts' } } }
      ]),
      FeedbackModel.find({ type: 'wrong_info', resolved: false }).sort({ createdAt: -1 }).limit(50).lean()
    ]);
    res.status(200).json({ success: true, schemes: counts, openReports: reports });
  }

  /** POST /api/stats/event { event: 'search' | 'scheme_view', language? } */
  public static trackEvent(req: Request, res: Response): void {
    const { event, language } = req.body || {};
    if (CLIENT_EVENTS.includes(event) && (TRACKED_EVENTS as readonly string[]).includes(event)) {
      StatsService.track(event as TrackedEvent, typeof language === 'string' ? language : undefined);
    }
    res.status(204).end();
  }

  /** GET /api/stats?days=30: anonymous usage totals for the impact dashboard */
  public static async stats(req: Request, res: Response): Promise<void> {
    if (!isDatabaseConnected()) {
      res.status(503).json({ success: false, message: 'Database not connected' });
      return;
    }
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    res.status(200).json({ success: true, days, ...(await StatsService.summary(days)) });
  }
}
