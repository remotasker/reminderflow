import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean)
);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ReminderFlow API is running' });
});

// Public routes
app.use('/api/auth',  authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/public', publicRoutes);

// Protected routes — any authenticated user
app.use('/api/events',    authMiddleware, eventRoutes);
app.use('/api/attendees', authMiddleware, attendeeRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/settings',  authMiddleware, settingsRoutes);
app.use('/api/support',   authMiddleware, supportRoutes);

// Admin-only routes
app.use('/api/templates', authMiddleware, requireAdmin, templateRoutes);
app.use('/api/org',       authMiddleware, orgRoutes);

// Error handling
app.use((_err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', _err);
  if (_err.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' });
  if (_err.message === 'Forbidden')    return res.status(403).json({ error: 'Forbidden' });
  if (_err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

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
