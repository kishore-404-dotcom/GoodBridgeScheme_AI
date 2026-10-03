import { Request, Response, NextFunction } from 'express';

/**
 * Small in-memory rate limiter for public write endpoints (feedback, stats), so the free
 * database can't be flooded. Counts requests per client IP in a sliding window.
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  const hits = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) {
      res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
      return;
    }
    recent.push(now);
    hits.set(ip, recent);
    // Drop idle clients occasionally so the map doesn't grow forever
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    next();
  };
};
