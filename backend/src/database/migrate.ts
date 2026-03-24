import * as dotenv from 'dotenv';
import { initializeDatabase, closePool } from './db';

dotenv.config();

async function migrate(): Promise<void> {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error(' Error: DATABASE_URL environment variable is not set!');
      console.error('\nPlease create backend/.env with:');
      console.error('DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reminderflow');
      console.error('JWT_SECRET=your-secret-key');
      console.error('SENDGRID_API_KEY=your-sendgrid-key');
      console.error('SENDGRID_FROM_EMAIL=no-reply@reminderflow.app');
      console.error('NODE_ENV=development');
      console.error('PORT=3001');
      process.exit(1);
    }

    console.log('Starting database migration...');
    console.log(`Connecting to: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
    await initializeDatabase();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

migrate();
