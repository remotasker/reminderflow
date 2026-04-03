import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

// ── Constants ─────────────────────────────────────────────────────────────────

export const AUTH_COOKIE_NAME    = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

function getRequiredEnv(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function isProduction(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'production';
}

export function assertAuthConfig(): void {
  getRequiredEnv('JWT_ACCESS_SECRET');
  getRequiredEnv('JWT_REFRESH_SECRET');
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  userId:         string;
  organizationId: string;
  email:          string;
  role:           string;
}

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePasswords(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Token generation ──────────────────────────────────────────────────────────

/**
 * Short-lived access token (15 minutes).
 * Sent on every authenticated request via httpOnly cookie.
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, getRequiredEnv('JWT_ACCESS_SECRET'), {
    expiresIn: '15m',
    algorithm: 'HS256',
  });
}

/**
 * Long-lived refresh token (7 days).
 * Stored hashed in the DB; cookie is scoped to /api/auth/refresh only.
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, getRequiredEnv('JWT_REFRESH_SECRET'), {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

// ── Token verification ────────────────────────────────────────────────────────

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getRequiredEnv('JWT_ACCESS_SECRET')) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getRequiredEnv('JWT_REFRESH_SECRET')) as JWTPayload;
  } catch {
    return null;
  }
}

// ── Cookie options ────────────────────────────────────────────────────────────

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure:   isProduction(),
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   15 * 60 * 1000,  // 15 minutes — matches token TTL
  };
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure:   isProduction(),
    sameSite: 'lax' as const,
    // Scoped to the refresh endpoint only so the cookie is never sent
    // on regular API calls, reducing the attack surface.
    path:     '/api/auth/refresh',
    maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days — matches token TTL
  };
}

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex <= 0) return cookies;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }

      return cookies;
    }, {});
}

export function getCookie(req: Request, name: string): string | null {
  return parseCookieHeader(req.headers.cookie)[name] ?? null;
}

// ── Legacy helper (kept for backwards-compat, prefer the typed helpers above) ─

/** @deprecated Use verifyAccessToken instead */
export function extractTokenFromRequest(req: Request): string | null {
  const cookieToken = getCookie(req, AUTH_COOKIE_NAME);
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** @deprecated Use verifyAccessToken instead */
export function verifyToken(token: string): JWTPayload | null {
  return verifyAccessToken(token);
}

/** @deprecated Use generateAccessToken instead */
export function generateToken(payload: JWTPayload): string {
  return generateAccessToken(payload);
}
