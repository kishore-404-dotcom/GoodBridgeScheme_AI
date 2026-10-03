import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Protects admin-only endpoints (e.g. reading citizen feedback messages) with the ADMIN_TOKEN
 * environment variable, sent as "Authorization: Bearer <token>". Disabled when no token is set.
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    res.status(404).json({ success: false, message: 'Not found' });
    return;
  }
  const given = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  next();
};
