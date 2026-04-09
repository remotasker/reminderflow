import { Request, Response, NextFunction } from 'express';
import { query } from '../database/db';

/**
 * requirePro — blocks access to Pro-only routes.
 * Returns 403 with { error, upgrade: true } for Free/expired orgs.
 */
export async function requirePro(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { rows } = await query(
      'SELECT plan, status FROM subscriptions WHERE organization_id = $1',
      [req.user.organizationId]
    );

    const sub = rows[0];

    // Allow if plan is 'pro' and status is active or trialing
    if (
      sub &&
      sub.plan === 'pro' &&
      (sub.status === 'active' || sub.status === 'trialing')
    ) {
      next();
      return;
    }

    res.status(403).json({
      error:   'This feature requires a Pro plan.',
      upgrade: true,
    });
  } catch (err) {
    console.error('Plan check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
