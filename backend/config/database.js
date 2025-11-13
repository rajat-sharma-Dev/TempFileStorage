import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false // Neon requires SSL
  } : false,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create files table
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100),
        duration_days INTEGER NOT NULL,
        price_usd DECIMAL(10, 6) NOT NULL,
        share_link VARCHAR(500) UNIQUE NOT NULL,
        expiry_date TIMESTAMP NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID REFERENCES files(id) ON DELETE CASCADE,
        amount_usd DECIMAL(10, 6) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        transaction_hash VARCHAR(255),
        payment_data JSONB,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create transactions table for audit trail
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID REFERENCES files(id) ON DELETE CASCADE,
        payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_files_expiry_date ON files(expiry_date);
      CREATE INDEX IF NOT EXISTS idx_files_share_link ON files(share_link);
      CREATE INDEX IF NOT EXISTS idx_files_payment_status ON files(payment_status);
      CREATE INDEX IF NOT EXISTS idx_payments_file_id ON payments(file_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_file_id ON transactions(file_id);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
