import pool from '../config/database.js';

// Create a transaction log
export const createTransaction = async (transactionData) => {
  const { fileId, paymentId, eventType, eventData } = transactionData;

  const query = `
    INSERT INTO transactions (file_id, payment_id, event_type, event_data)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [fileId, paymentId || null, eventType, eventData || null];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get transactions by file ID
export const getTransactionsByFileId = async (fileId) => {
  const query = 'SELECT * FROM transactions WHERE file_id = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [fileId]);
  return result.rows;
};

// Get all transactions (for audit)
export const getAllTransactions = async (limit = 100) => {
  const query = 'SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1';
  const result = await pool.query(query, [limit]);
  return result.rows;
};
