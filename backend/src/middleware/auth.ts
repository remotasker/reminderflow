import { Request, Response, NextFunction } from 'express';
import { extractTokenFromRequest, verifyAccessToken, JWTPayload } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Reads the access token from the httpOnly cookie (preferred) or the
 * Authorization: Bearer header (for API clients / CLI tools).
 * Attaches the decoded payload to req.user on success.
 */
export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromRequest(req);

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    // Return a distinct code so the client knows to attempt a silent refresh
    // rather than immediately redirecting to /login.
    res.status(401).json({ error: 'Access token expired or invalid', code: 'TOKEN_EXPIRED' });
    return;
  }

  req.user = payload;
  next();
}
