import express from 'express';
import  cors from 'cors';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './database/db';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import attendeeRoutes from './routes/attendees';
import analyticsRoutes from './routes/analytics';
import emailRoutes from './routes/email';
import authMiddleware from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ReminderFlow API is running' });
});

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Email tracking routes (public but with tracking ID)
app.use('/api/email', emailRoutes);

// Protected routes (auth required)
app.use('/api/events', authMiddleware, eventRoutes);
app.use('/api/attendees', authMiddleware, attendeeRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.message === 'Unauthorized') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (err.message === 'Forbidden') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
