import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// File API
export const fileAPI = {
  // Upload file
  upload: async (formData, onUploadProgress) => {
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Get file info by share link
  getFileInfo: async (shareLink) => {
    const response = await api.get(`/files/info/${shareLink}`);
    return response.data;
  },

  // Get all files (admin/debug)
  getAllFiles: async () => {
    const response = await api.get('/files/all');
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  // Initiate payment
  initiate: async (fileId) => {
    const response = await api.post('/payment/initiate', { fileId });
    return response.data;
  },

  // Complete payment
  complete: async (fileId, transactionHash, paymentData) => {
    const response = await api.post('/payment/complete', {
      fileId,
      transactionHash,
      paymentData,
    });
    return response.data;
  },

  // Get payment status
  getStatus: async (fileId) => {
    const response = await api.get(`/payment/status/${fileId}`);
    return response.data;
  },
};

// Download API
export const downloadAPI = {
  // Get download URL
  getDownloadUrl: (shareLink) => {
    // Remove /api from base URL since download route is separate
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/api/download/${shareLink}`;
  },

  // Download file
  download: async (shareLink) => {
    const response = await api.get(`/download/${shareLink}`, {
      responseType: 'blob',
    });
    return response;
  },
};

// Export API_BASE_URL for components that need it
export { API_BASE_URL };

export default api;
