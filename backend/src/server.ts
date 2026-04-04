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
import authMiddleware  from './middleware/auth';
import { requireAdmin } from './middleware/rbac';
import { startWorker } from './workers/emailWorker';
import { assertAuthConfig } from './utils/auth';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Allowed origins ───────────────────────────────────────────────────────────

// Read allowed origins at request time (not at startup) so Railway
// env var changes take effect without a redeploy, and so the Set is
// never built from stale/missing values during the boot sequence.
function getAllowedOrigins(): Set<string> {
  return new Set(
    [
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter(Boolean) as string[]
  );
}

function corsOriginHandler(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) {
  // Log on every request so Railway logs show the exact origin being checked
  // and what origins are currently allowed. Remove once confirmed working.
  const allowed = getAllowedOrigins();
  console.log(`[CORS] origin=${origin ?? 'none'} allowed=[${[...allowed].join(', ')}]`);

  if (!origin || allowed.has(origin)) {
    callback(null, true);
  } else {
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
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure || process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── Body parsing + cookies ────────────────────────────────────────────────────

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieParser());  // ← required for req.cookies to work

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ReminderFlow API is running' });
});

// ── Public routes ─────────────────────────────────────────────────────────────

app.use('/api/auth',   authRoutes);
app.use('/api/email',  emailRoutes);
app.use('/api/public', publicRoutes);

// ── Protected routes ──────────────────────────────────────────────────────────

app.use('/api/events',    authMiddleware, eventRoutes);
app.use('/api/attendees', authMiddleware, attendeeRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/settings',  authMiddleware, settingsRoutes);
app.use('/api/support',   authMiddleware, supportRoutes);

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