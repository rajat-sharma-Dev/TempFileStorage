import pool from '../config/database.js';

// Create a payment record
export const createPayment = async (paymentData) => {
  const { fileId, amountUsd, paymentStatus } = paymentData;

  const query = `
    INSERT INTO payments (file_id, amount_usd, payment_status)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const values = [fileId, amountUsd, paymentStatus || 'pending'];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update payment status
export const updatePaymentStatus = async (paymentId, status, transactionHash = null, paymentData = null) => {
  const query = `
    UPDATE payments 
    SET payment_status = $1::varchar, 
        transaction_hash = $2::varchar, 
        payment_data = $3::jsonb, 
        paid_at = CASE WHEN $1::varchar = 'completed' THEN NOW() ELSE paid_at END
    WHERE id = $4::uuid 
    RETURNING *
  `;
  
  // Convert paymentData to JSON string if it's an object
  const jsonPaymentData = paymentData ? JSON.stringify(paymentData) : null;
  
  const result = await pool.query(query, [status, transactionHash, jsonPaymentData, paymentId]);
  return result.rows[0];
};

// Get payment by file ID
export const getPaymentByFileId = async (fileId) => {
  const query = 'SELECT * FROM payments WHERE file_id = $1 ORDER BY created_at DESC LIMIT 1';
  const result = await pool.query(query, [fileId]);
  return result.rows[0];
};

// Get payment by ID
export const getPaymentById = async (id) => {
  const query = 'SELECT * FROM payments WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
