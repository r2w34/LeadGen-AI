import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'leadgen_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'leadgen_ai',
  password: process.env.DB_PASSWORD || 'leadgen_secure_2024',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default {
  query: (text, params) => pool.query(text, params),
  pool,
};
