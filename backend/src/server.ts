import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './database/db';
import authRoutes      from './routes/auth';
import eventRoutes     from './routes/events';
import attendeeRoutes  from './routes/attendees';
import analyticsRoutes from './routes/analytics';
import emailRoutes     from './routes/email';
import templateRoutes  from './routes/templates';
import orgRoutes       from './routes/org';
import publicRoutes    from './routes/public';
import settingsRoutes  from './routes/settings';
import supportRoutes   from './routes/support';
import billingRoutes   from './routes/billing';
import videoRoutes     from './routes/video';
import { query }       from './database/db';
import { isUuid }      from './utils/validation';
import authMiddleware  from './middleware/auth';
import { requireAdmin } from './middleware/rbac';
import { startWorker } from './workers/emailWorker';
import { assertAuthConfig } from './utils/auth';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Allowed origins ───────────────────────────────────────────────────────────

// Hardcoded + env-var origins — belt and suspenders approach.
// The Vercel URLs are hardcoded so a missing env var can never block login.
const HARDCODED_ORIGINS = [
  'https://reminderflow-ten.vercel.app',            // ← actual frontend URL
  'https://reminderflow-frontend.vercel.app',
  'https://reminderflow-frontend-qct7.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001/api',
  'http://127.0.0.1:3000',
];

function expandOriginCandidate(value: string | undefined): string[] {
  if (!value) return [];

  const candidates = new Set<string>([value]);

  try {
    candidates.add(new URL(value).origin);
  } catch {
    // Ignore invalid URLs and keep the raw value for exact matching.
  }

  return [...candidates];
}

function getAllowedOrigins(): Set<string> {
  return new Set([
    ...HARDCODED_ORIGINS,
    ...expandOriginCandidate(process.env.FRONTEND_URL),
    ...expandOriginCandidate(process.env.NEXT_PUBLIC_API_URL),
  ]);
}

function corsOriginHandler(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) {
  const allowed = getAllowedOrigins();
  console.log(`[CORS] origin=${origin ?? 'none'} | allowed=${[...allowed].join(', ')}`);

  if (!origin || allowed.has(origin)) {
    callback(null, true);
  } else {
    // Log the mismatch so Railway logs show the exact failing origin
    console.error(`[CORS] BLOCKED: "${origin}" not in allowed list`);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  }
}

const corsOptions: cors.CorsOptions = {
  origin:       corsOriginHandler,
  credentials:  true,
  methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Tell the browser it can cache the preflight result for 10 minutes
  // so it doesn't fire an OPTIONS request on every single API call.
  maxAge: 600,
};

app.disable('x-powered-by');
app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
// Must be registered BEFORE all routes.
// The app.options('*') line is the critical fix — it tells Express to
// respond to preflight OPTIONS requests immediately with the correct
// CORS headers instead of falling through to route handlers that don't
// handle OPTIONS and return a 404/405.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // ← handle ALL preflight requests

// ── Security headers ──────────────────────────────────────────────────────────

app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  // Note: camera/microphone NOT blocked here so Daily.co video rooms work.
  if (req.secure || process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── Body parsing + cookies ────────────────────────────────────────────────────

// Stripe webhook needs raw body for signature verification — mount BEFORE express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieParser());  // ← required for req.cookies to work

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ReminderFlow API is running' });
});

// ── Public routes ─────────────────────────────────────────────────────────────

app.use('/api/auth',    authRoutes);
app.use('/api/email',   emailRoutes);
app.use('/api/public',  publicRoutes);
app.use('/api/billing', billingRoutes);

// Public video-token endpoint — attendees join without auth
app.post('/api/video/public-token', async (req, res) => {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) {
    return res.status(503).json({ error: 'Video not configured' });
  }
  const { eventId, displayName } = req.body ?? {};
  if (!eventId || !isUuid(eventId)) {
    return res.status(400).json({ error: 'eventId is required' });
  }
  try {
    const result = await query('SELECT daily_room_name FROM events WHERE id = $1', [eventId]);
    if (!result.rows[0]?.daily_room_name) {
      return res.status(404).json({ error: 'No video room found' });
    }
    const roomName: string = result.rows[0].daily_room_name;
    const exp = Math.floor(Date.now() / 1000) + 4 * 60 * 60;
    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({ properties: { room_name: roomName, is_owner: false, exp, user_name: displayName || 'Attendee' } }),
    });
    if (!tokenRes.ok) return res.status(502).json({ error: 'Failed to generate token' });
    const { token } = await tokenRes.json() as { token: string };
    return res.json({ token, roomName });
  } catch (err) {
    console.error('[public-token] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Protected routes ──────────────────────────────────────────────────────────

app.use('/api/events',    authMiddleware, eventRoutes);
app.use('/api/attendees', authMiddleware, attendeeRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/settings',  authMiddleware, settingsRoutes);
app.use('/api/support',   authMiddleware, supportRoutes);
app.use('/api/video',     authMiddleware, videoRoutes);

// ── Admin-only routes ─────────────────────────────────────────────────────────

app.use('/api/templates', authMiddleware, requireAdmin, templateRoutes);
app.use('/api/org',       authMiddleware, orgRoutes);

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  if (err.message === 'Unauthorized')
    return res.status(401).json({ error: 'Unauthorized' });
  if (err.message === 'Forbidden')
    return res.status(403).json({ error: 'Forbidden' });
  if (err.message?.startsWith('CORS:'))
    return res.status(403).json({ error: 'Origin not allowed' });
  res.status(500).json({ error: 'Internal server error' });
});

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Startup ───────────────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
  try {
    assertAuthConfig();
    console.log('Initializing database…');
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    await startWorker();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
