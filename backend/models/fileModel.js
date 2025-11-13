import pool from '../config/database.js';

// Create a new file entry
export const createFile = async (fileData) => {
  const {
    filename,
    originalFilename,
    filepath,
    fileSize,
    mimeType,
    durationDays,
    priceUsd,
    shareLink,
    expiryDate,
  } = fileData;

  const query = `
    INSERT INTO files (
      filename, original_filename, filepath, file_size, mime_type, 
      duration_days, price_usd, share_link, expiry_date, payment_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    filename,
    originalFilename,
    filepath,
    fileSize,
    mimeType,
    durationDays,
    priceUsd,
    shareLink,
    expiryDate,
    'pending',
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get file by share link
export const getFileByShareLink = async (shareLink) => {
  const query = 'SELECT * FROM files WHERE share_link = $1';
  const result = await pool.query(query, [shareLink]);
  return result.rows[0];
};

// Get file by ID
export const getFileById = async (id) => {
  const query = 'SELECT * FROM files WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Update file payment status
export const updateFilePaymentStatus = async (fileId, status) => {
  const query = `
    UPDATE files 
    SET payment_status = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING *
  `;
  const result = await pool.query(query, [status, fileId]);
  return result.rows[0];
};

// Get expired files
export const getExpiredFiles = async () => {
  const query = `
    SELECT * FROM files 
    WHERE expiry_date < NOW() AND payment_status = 'completed'
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Delete file by ID
export const deleteFileById = async (id) => {
  const query = 'DELETE FROM files WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Get all files (for admin/debug purposes)
export const getAllFiles = async (limit = 100) => {
  const query = 'SELECT * FROM files ORDER BY created_at DESC LIMIT $1';
  const result = await pool.query(query, [limit]);
  return result.rows;
};
