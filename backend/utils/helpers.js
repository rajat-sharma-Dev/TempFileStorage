import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Generate unique share link
export const generateShareLink = () => {
  // Generate a short unique ID (8 characters)
  const shortId = crypto.randomBytes(6).toString('base64url');
  return shortId;
};

// Calculate expiry date based on duration
export const calculateExpiryDate = (durationDays) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays));
  return expiryDate;
};

// Format file size to human readable
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Check if file is expired
export const isFileExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

// Validate file upload
export const validateFileUpload = (file, maxSize = 100 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds maximum limit of ${formatFileSize(maxSize)}` 
    };
  }

  return { valid: true };
};
