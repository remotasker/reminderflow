import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query, getClient } from '../database/db';
import authMiddleware from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit';
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getCookie,
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getAuthCookieOptions,
  getRefreshCookieOptions,
} from '../utils/auth';
import {
  exceedsJsonSize,
  isPlainObject,
  normalizeEmail,
  normalizeName,
  validatePasswordStrength,
} from '../utils/validation';
import { mergeUserSettings } from '../utils/settings';

const router = Router();

const authCookieOptions    = getAuthCookieOptions();
const refreshCookieOptions = getRefreshCookieOptions();

// Clear-cookie options must match the Set-Cookie attributes exactly,
// otherwise the browser won't remove the cookie.
const clearAccessCookieOptions = {
  httpOnly: authCookieOptions.httpOnly,
  secure:   authCookieOptions.secure,
  sameSite: authCookieOptions.sameSite,
  path:     authCookieOptions.path,
};
const clearRefreshCookieOptions = {
  httpOnly: refreshCookieOptions.httpOnly,
  secure:   refreshCookieOptions.secure,
  sameSite: refreshCookieOptions.sameSite,
  path:     refreshCookieOptions.path,
};

const registerRateLimit = createRateLimit({
  keyPrefix: 'auth:register',
  limit: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many registration attempts. Please try again later.',
});

const loginRateLimit = createRateLimit({
  keyPrefix: 'auth:login',
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many login attempts. Please try again later.',
});

const refreshRateLimit = createRateLimit({
  keyPrefix: 'auth:refresh',
  limit: 30,
  windowMs: 15 * 60 * 1000,
  message: 'Too many refresh attempts. Please try again later.',
});

// ── helpers ───────────────────────────────────────────────────────────────────

/** SHA-256 hash of a raw token. Store this in the DB, never the raw value. */
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function serializeUser(user: {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  role: string;
  settings?: unknown;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    organizationId: user.organization_id,
    role: user.role,
    settings: user.settings || {},
  };
}

/**
 * Mint both tokens, persist the hashed refresh token, and set both cookies.
 * Pass an existing `family` UUID when rotating; omit it on first login.
 */
async function issueTokenPair(
  res: Response,
  payload: { userId: string; organizationId: string; email: string; role: string },
  existingFamily?: string
): Promise<void> {
  const family       = existingFamily ?? uuidv4();
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await query(
    `INSERT INTO refresh_tokens (user_id, org_id, token_hash, family, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
    [payload.userId, payload.organizationId, hashToken(refreshToken), family]
  );

  // Access token: short-lived, sent on every API request
  res.cookie(AUTH_COOKIE_NAME, accessToken, authCookieOptions);

  // Refresh token: long-lived, scoped to /api/auth/refresh only
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

// ── routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user + organisation in a single transaction.
 */
router.post('/register', registerRateLimit, async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { email, password, name, organizationName, country } = req.body;
    const normalizedEmail   = normalizeEmail(email);
    const normalizedName    = normalizeName(name);
    const passwordError     = validatePasswordStrength(password);

    // Org name: use provided organizationName if given, else fall back to user name
    const rawOrgName      = organizationName ? String(organizationName).trim() : '';
    const normalizedOrgName = rawOrgName.length > 0 ? normalizeName(rawOrgName) : normalizedName;
    const normalizedCountry = country ? String(country).trim().slice(0, 100) : null;

    if (!normalizedEmail || !normalizedName || passwordError) {
      return res.status(400).json({ error: passwordError || 'Valid name and email are required' });
    }

    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const organizationId = uuidv4();
    const userId         = uuidv4();
    const passwordHash   = await hashPassword(password);
    const slug           = (normalizedOrgName ?? normalizedName).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await client.query('BEGIN');

    await client.query(
      'INSERT INTO organizations (id, name, slug, country) VALUES ($1, $2, $3, $4)',
      [organizationId, normalizedOrgName, `${slug}-${organizationId.substring(0, 8)}`, normalizedCountry]
    );

    await client.query(
      `INSERT INTO users (id, organization_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')`,
      [userId, organizationId, normalizedEmail, passwordHash, normalizedName]
    );

    // Create a free subscription row for the new organization
    await client.query(
      `INSERT INTO subscriptions (organization_id, plan, status)
       VALUES ($1, 'free', 'active')
       ON CONFLICT (organization_id) DO NOTHING`,
      [organizationId]
    );

    await client.query('COMMIT');

    await issueTokenPair(res, {
      userId,
      organizationId,
      email: normalizedEmail,
      role: 'admin',
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        email: normalizedEmail,
        fullName: normalizedName,
        organizationId,
        role: 'admin',
        settings: {},
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', loginRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await query(
      `SELECT id, email, password_hash, full_name, organization_id, role, settings
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    // Constant-time failure: run compare even when user not found to prevent
    // timing attacks that would reveal whether an email is registered.
    const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
    const isValid = user
      ? await comparePasswords(password, user.password_hash)
      : await comparePasswords(password, dummyHash).then(() => false);

    if (!user || !isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await issueTokenPair(res, {
      userId:         user.id,
      organizationId: user.organization_id,
      email:          user.email,
      role:           user.role,
    });

    return res.json({
      message: 'Login successful',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Rotates the refresh token. Uses token family reuse detection:
 * if a revoked token is replayed, every token in that family is revoked
 * (signals a stolen token) and the user must log in again.
 */
router.post('/refresh', refreshRateLimit, async (req: Request, res: Response) => {
  const incoming = getCookie(req, REFRESH_COOKIE_NAME);

  if (!incoming) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  // Verify signature & expiry before hitting the DB
  const payload = verifyRefreshToken(incoming);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const hash = hashToken(incoming);

  const { rows } = await query(
    `SELECT id, family, revoked
     FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > NOW()`,
    [hash]
  );

  const stored = rows[0];

  if (!stored) {
    return res.status(401).json({ error: 'Refresh token not found or expired' });
  }

  // ── Reuse detection ──────────────────────────────────────────────────────
  // A valid but already-revoked token means someone is replaying a stolen token.
  // Invalidate the entire family so the legitimate user is forced to re-authenticate.
  if (stored.revoked) {
    await query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE family = $1',
      [stored.family]
    );
    res.clearCookie(AUTH_COOKIE_NAME,    clearAccessCookieOptions);
    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);
    return res.status(401).json({
      error: 'Token reuse detected — all sessions have been revoked. Please log in again.',
    });
  }

  // Revoke the consumed token (one-time use)
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [stored.id]);

  // Fetch the latest role from the DB so role changes take effect on next refresh
  // instead of waiting for the old JWT to expire.
  const userResult = await query(
    'SELECT email, role FROM users WHERE id = $1 AND organization_id = $2',
    [payload.userId, payload.organizationId]
  );
  const currentEmail = userResult.rows[0]?.email ?? payload.email;
  const currentRole = userResult.rows[0]?.role ?? payload.role;

  await issueTokenPair(
    res,
    { ...payload, email: currentEmail, role: currentRole },
    stored.family  // keep the same family so the chain is traceable
  );

  return res.json({ ok: true });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, organization_id, role, settings
       FROM users
       WHERE id = $1 AND organization_id = $2`,
      [req.user!.userId, req.user!.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = result.rows[0];
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('Session lookup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/auth/me
 * Update the authenticated user's profile and preferences.
 */
router.put('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fullName, email, currentPassword, newPassword, preferences } = req.body;

    const normalizedName = fullName === undefined ? undefined : normalizeName(fullName);
    const normalizedEmail = email === undefined ? undefined : normalizeEmail(email);

    if (fullName !== undefined && !normalizedName) {
      return res.status(400).json({ error: 'Full name must be between 1 and 255 characters' });
    }

    if (email !== undefined && !normalizedEmail) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const passwordChangeRequested = currentPassword !== undefined || newPassword !== undefined;
    if (passwordChangeRequested) {
      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are both required to change your password' });
      }

      const passwordError = validatePasswordStrength(newPassword);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }
    }

    if (preferences !== undefined && (!isPlainObject(preferences) || exceedsJsonSize(preferences, 5_000))) {
      return res.status(400).json({ error: 'Preferences payload is invalid' });
    }

    const result = await query(
      `SELECT id, email, password_hash, full_name, organization_id, role, settings
       FROM users
       WHERE id = $1 AND organization_id = $2`,
      [req.user!.userId, req.user!.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = result.rows[0];

    if (normalizedEmail && normalizedEmail !== user.email) {
      const duplicate = await query(
        'SELECT id FROM users WHERE email = $1 AND id <> $2',
        [normalizedEmail, user.id]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ error: 'That email address is already in use' });
      }
    }

    let passwordHash = user.password_hash;
    if (passwordChangeRequested) {
      const matches = await comparePasswords(currentPassword, user.password_hash);
      if (!matches) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      passwordHash = await hashPassword(newPassword);
    }

    const mergedSettings = preferences === undefined
      ? user.settings || {}
      : mergeUserSettings(user.settings, {
          preferences: {
            notifyOnRegistration: Boolean(preferences.notifyOnRegistration),
            weeklySummary: Boolean(preferences.weeklySummary),
          },
        });

    await query(
      `UPDATE users SET
         email = COALESCE($1, email),
         full_name = COALESCE($2, full_name),
         password_hash = $3,
         settings = $4,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND organization_id = $6`,
      [
        normalizedEmail ?? null,
        normalizedName ?? null,
        passwordHash,
        JSON.stringify(mergedSettings),
        req.user!.userId,
        req.user!.organizationId,
      ]
    );

    const updatedResult = await query(
      `SELECT id, email, full_name, organization_id, role, settings
       FROM users
       WHERE id = $1 AND organization_id = $2`,
      [req.user!.userId, req.user!.organizationId]
    );

    return res.json({
      message: 'Profile updated successfully',
      user: serializeUser(updatedResult.rows[0]),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Revokes the current refresh token and clears both cookies.
 */
router.post('/logout', async (req: Request, res: Response) => {
  const incoming = getCookie(req, REFRESH_COOKIE_NAME);
  if (incoming) {
    await query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
      [hashToken(incoming)]
    ).catch(() => { /* best-effort revocation */ });
  }

  res.clearCookie(AUTH_COOKIE_NAME,    clearAccessCookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);
  return res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/logout-all
 * Revokes every active session for the authenticated user.
 */
router.post('/logout-all', authMiddleware, async (req: Request, res: Response) => {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE',
    [req.user!.userId]
  );

  res.clearCookie(AUTH_COOKIE_NAME,    clearAccessCookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);
  return res.json({ message: 'All sessions revoked' });
});

export default router;
