// Format file size to human readable
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Format date to readable string
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate time remaining
export const getTimeRemaining = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry - now;

  if (diff <= 0) {
    return 'Expired';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Get pricing info
export const PRICING_INFO = {
  1: { days: 1, price: 0.05, label: '1 Day' },
  7: { days: 7, price: 0.15, label: '7 Days' },
  30: { days: 30, price: 0.25, label: '30 Days' },
};

// Validate file
export const validateFile = (file, maxSize = 100 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${formatFileSize(maxSize)}`,
    };
  }

  return { valid: true };
};
