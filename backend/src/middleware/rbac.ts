import { Request, Response, NextFunction } from 'express';

// ── Role freshness note ───────────────────────────────────────────────────────
//
// The role is embedded in the JWT access token at login time. Because the
// access token is short-lived (15 min), a role change takes effect at most
// 15 minutes later without any extra work — the next refresh cycle pulls the
// current role from the DB (see auth.routes.ts → /refresh).
//
// If you need immediate role revocation (e.g. "fire this admin now"), call
// POST /api/auth/logout-all for that user to invalidate all their sessions.
//
// ─────────────────────────────────────────────────────────────────────────────

function checkRole(req: Request, roles: string[]): boolean {
  if (!req.user) return false;
  return roles.includes(req.user.role);
}

/**
 * Restricts a route to admin users only.
 * Must be applied AFTER authMiddleware so req.user is populated.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!checkRole(req, ['admin'])) { res.status(403).json({ error: 'Admin access required' }); return; }
  next();
}

/**
 * Allows admin and manager roles.
 */
export function requireManagerOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!checkRole(req, ['admin', 'manager'])) { res.status(403).json({ error: 'Access denied' }); return; }
  next();
}

/**
 * Middleware factory for arbitrary role lists.
 * Example: router.delete('/org', authMiddleware, requireRoles('admin'), handler)
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!checkRole(req, roles)) { res.status(403).json({ error: 'Access denied' }); return; }
    next();
  };
}