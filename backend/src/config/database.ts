import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// If using individual connection parameters instead of DATABASE_URL
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  poolConfig.host = process.env.DB_HOST;
  poolConfig.port = parseInt(process.env.DB_PORT || '5432');
  poolConfig.database = process.env.DB_NAME;
  poolConfig.user = process.env.DB_USER;
  poolConfig.password = process.env.DB_PASSWORD;
}

export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on PostgreSQL client', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = () => pool.connect();

// Close pool gracefully
export const closePool = async () => {
  await pool.end();
  console.log('✅ PostgreSQL pool closed');
};

export default { pool, query, getClient, closePool };
