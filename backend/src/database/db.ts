import 'dotenv/config';
import { Pool, PoolClient, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Neon requires SSL on all connections.
  // rejectUnauthorized: false accepts Neon's certificate without needing
  // a local CA bundle — safe for both dev and production.
  ssl: {
    rejectUnauthorized: false,
  },

  // Give Neon's free tier up to 10 seconds to wake from auto-suspend
  // before timing out. Without this the default ~4s is too short.
  connectionTimeoutMillis: 10_000,

  // Release idle connections after 30s so Neon can suspend cleanly.
  idleTimeoutMillis: 30_000,

  // Max connections — Neon free tier supports up to 100 but keep it
  // conservative so you don't exhaust the pool across deployments.
  max: 10,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

// ── Query helper ───────────────────────────────────────────────────────────

export interface QueryParams {
  [key: string]: any;
}

export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult<any>> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    console.log(`Executed query (${Date.now() - start}ms)`);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// ── Client helper ──────────────────────────────────────────────────────────

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

// ── Schema initializer ─────────────────────────────────────────────────────

export async function initializeDatabase(): Promise<void> {
  const client = await getClient();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Initializing database schema...');
    await client.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ── Pool teardown ──────────────────────────────────────────────────────────

export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;