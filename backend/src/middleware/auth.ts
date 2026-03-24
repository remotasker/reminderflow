import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken, JWTPayload } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req.headers.authorization);
  
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  
  req.user = payload;
  next();
}
