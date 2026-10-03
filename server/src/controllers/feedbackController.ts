import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { FeedbackModel, FEEDBACK_TYPES, FeedbackType, REPORT_REASONS, ReportReason } from '../models/Feedback';
import { isDatabaseConnected } from '../config/database';
import { SchemeStore } from '../services/schemeStore';
import { StatsService, TRACKED_EVENTS, TrackedEvent } from '../services/statsService';

/** Events the website itself may report (server-side events are tracked where they happen) */
const CLIENT_EVENTS: TrackedEvent[] = ['search', 'scheme_view'];
const REPORT_STATUSES = ['open', 'resolved', 'all'] as const;

/** Scheme id → name, for the admin view */
const schemeNames = async (): Promise<Map<string, string>> =>
  new Map((await SchemeStore.getAll()).map((s) => [s.schemeId, s.name]));

export class FeedbackController {
  /** POST /api/feedback { schemeId, type: helpful | not_helpful | wrong_info, reason?, message?, language? } */
  public static async submit(req: Request, res: Response): Promise<void> {
    const { schemeId, type, reason, message, language } = req.body || {};
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
        // Reports always carry a reason; votes never do
        reason: type === 'wrong_info' ? (REPORT_REASONS.includes(reason) ? (reason as ReportReason) : 'other') : undefined,
        message: typeof message === 'string' ? message.trim().slice(0, 1000) : undefined,
        language: typeof language === 'string' ? language.slice(0, 5) : undefined
      });
      StatsService.track('feedback', typeof language === 'string' ? language : undefined);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Could not save feedback' });
    }
  }

  /** GET /api/feedback/scheme/:schemeId: public vote counts for one scheme (never messages) */
  public static async schemeScore(req: Request, res: Response): Promise<void> {
    if (!isDatabaseConnected()) {
      res.status(200).json({ success: true, available: false, helpful: 0, notHelpful: 0 });
      return;
    }
    const rows = await FeedbackModel.aggregate([
      { $match: { schemeId: String(req.params.schemeId), type: { $in: ['helpful', 'not_helpful'] } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const count = (t: string) => rows.find((r) => r._id === t)?.count ?? 0;
    res.status(200).json({ success: true, available: true, helpful: count('helpful'), notHelpful: count('not_helpful') });
  }

  /**
   * GET /api/feedback/summary?status=open|resolved|all (admin): totals, per-scheme counts and
   * error reports with the scheme name
   */
  public static async summary(req: Request, res: Response): Promise<void> {
    if (!isDatabaseConnected()) {
      res.status(503).json({ success: false, message: 'Database not connected' });
      return;
    }
    const status = (REPORT_STATUSES as readonly string[]).includes(String(req.query.status)) ? String(req.query.status) : 'open';
    const reportFilter: Record<string, unknown> = { type: 'wrong_info' };
    if (status !== 'all') reportFilter.resolved = status === 'resolved';

    const [counts, reports, totals, names] = await Promise.all([
      FeedbackModel.aggregate([
        { $group: { _id: { schemeId: '$schemeId', type: '$type' }, count: { $sum: 1 } } },
        { $group: { _id: '$_id.schemeId', counts: { $push: { k: '$_id.type', v: '$count' } }, total: { $sum: '$count' } } },
        { $sort: { total: -1 } },
        { $limit: 100 },
        { $project: { _id: 0, schemeId: '$_id', total: 1, counts: { $arrayToObject: '$counts' } } }
      ]),
      FeedbackModel.find(reportFilter).sort({ createdAt: -1 }).limit(100).lean(),
      FeedbackModel.aggregate([
        { $group: { _id: { type: '$type', resolved: '$resolved' }, count: { $sum: 1 } } }
      ]),
      schemeNames()
    ]);

    const sum = (pred: (t: { type: string; resolved: boolean }) => boolean) =>
      totals.filter((r) => pred(r._id)).reduce((a, r) => a + r.count, 0);

    res.status(200).json({
      success: true,
      status,
      totals: {
        helpful: sum((t) => t.type === 'helpful'),
        notHelpful: sum((t) => t.type === 'not_helpful'),
        reports: sum((t) => t.type === 'wrong_info'),
        openReports: sum((t) => t.type === 'wrong_info' && !t.resolved)
      },
      schemes: counts.map((c) => ({ ...c, name: names.get(c.schemeId) || c.schemeId })),
      reports: reports.map((r) => ({ ...r, schemeName: names.get(r.schemeId) || r.schemeId }))
    });
  }

  /** PATCH /api/feedback/:id { resolved: boolean } (admin): mark an error report as fixed or reopen it */
  public static async setResolved(req: Request, res: Response): Promise<void> {
    if (!isDatabaseConnected()) {
      res.status(503).json({ success: false, message: 'Database not connected' });
      return;
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id) || typeof req.body?.resolved !== 'boolean') {
      res.status(400).json({ success: false, message: 'A valid id and resolved (true/false) are required' });
      return;
    }
    const updated = await FeedbackModel.findOneAndUpdate(
      { _id: id, type: 'wrong_info' },
      { resolved: req.body.resolved },
      { new: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }
    res.status(200).json({ success: true, report: updated });
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
