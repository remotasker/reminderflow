import 'dotenv/config';
import { Pool, PoolClient, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export interface QueryParams {
  [key: string]: any;
}

/**
 * Execute a query with parameters
 */
export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult<any>> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query (${duration}ms)`);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Initialize database schema
 */
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

/**
 * Close all connections
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
