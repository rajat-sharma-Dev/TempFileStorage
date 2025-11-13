// x402 Service - Manual x402 Protocol Implementation for Dynamic Pricing
// Works with our advanced x402 backend implementation
import axios from 'axios';
import { createPaymentHeader } from 'x402/client';
import { baseSepolia } from 'viem/chains';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Parse x402 payment requirements from 402 response
 */
const parsePaymentRequirements = (responseData) => {
  if (!responseData.accepts || !Array.isArray(responseData.accepts)) {
    throw new Error('Invalid 402 response format');
  }
  
  return responseData.accepts[0]; // Get first payment option
};

/**
 * Create x402 payment header using the official x402 client library
 */
const createX402PaymentHeader = async (paymentReq, walletClient, userAddress) => {
  try {
    console.log('Creating x402 payment for:', paymentReq);
    
    // The x402 client library handles everything:
    // 1. Makes the USDC payment
    // 2. Creates the proper authorization signature
    // 3. Encodes the payment in the correct format
    const paymentHeader = await createPaymentHeader(
      walletClient,
      1, // x402Version
      paymentReq // PaymentRequirements object
    );

    console.log('✅ Payment header created successfully');
    console.log('📦 Payment header length:', paymentHeader.length);
    console.log('📦 Payment header (first 200 chars):', paymentHeader.substring(0, 200) + '...');
    
    return paymentHeader;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};

/**
 * Upload file with x402 payment handling
 * Follows the advanced x402 protocol with dynamic pricing
 */
export const uploadFileWithX402 = async (formData, walletClient, publicClient, userAddress) => {
  try {
    console.log('📤 Starting x402 upload flow...');

    // Validate that publicClient is provided
    if (!publicClient) {
      throw new Error('Public client is required for reading blockchain data');
    }

    // Step 1: Make initial request to get payment requirements (will return 402)
    let response;
    try {
      response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        validateStatus: (status) => status === 402 || status === 201,
      });
    } catch (error) {
      console.error('❌ Initial upload request failed:', error);
      throw new Error(error.response?.data?.error || 'Upload request failed');
    }

    // Step 2: Handle 402 Payment Required
    if (response.status === 402) {
      console.log('💰 402 Payment Required - Processing payment...');
      
      const paymentInfo = response.data;
      console.log('Payment requirements:', paymentInfo);

      // Parse payment requirements
      const paymentReq = parsePaymentRequirements(paymentInfo);
      
      // Make the USDC payment and create payment header using x402 client
      const paymentHeader = await createX402PaymentHeader(
        paymentReq,
        walletClient,
        userAddress
      );

      console.log('✅ Payment completed, retrying upload with proof...');

      // Step 3: Retry upload with payment header
      response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Payment': paymentHeader, // Include payment proof
        },
        validateStatus: (status) => status === 201 || status === 402,
      });

      if (response.status === 402) {
        throw new Error('Payment verification failed. Please try again.');
      }
    }

    // Step 4: Return success data
    if (response.status === 201) {
      console.log('✅ Upload successful!');
      return response.data.data;
    }

    throw new Error('Unexpected response from server');
    
  } catch (error) {
    console.error('❌ Upload with x402 error:', error);
    throw error;
  }
};

/**
 * Download file with x402 payment handling
 */
export const downloadFileWithX402 = async (shareLink, walletClient, publicClient, userAddress) => {
  try {
    console.log('📥 Starting x402 download flow...');

    // Validate that publicClient is provided
    if (!publicClient) {
      throw new Error('Public client is required for reading blockchain data');
    }

    // Step 1: Initial download attempt
    let response;
    try {
      response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/download/${shareLink}`, {
        responseType: 'blob',
        validateStatus: (status) => status === 200 || status === 402,
      });
    } catch (error) {
      console.error('❌ Download request failed:', error);
      throw new Error(error.response?.data?.error || 'Download failed');
    }

    // Step 2: Handle 402 if payment required
    if (response.status === 402) {
      console.log('💰 402 Payment Required for download');
      
      // Parse payment requirements from response
      const paymentInfo = await response.data.text();
      const paymentData = JSON.parse(paymentInfo);
      const paymentReq = parsePaymentRequirements(paymentData);
      
      // Make payment
      const paymentHeader = await createPaymentHeader(
        paymentReq,
        walletClient,
        userAddress,
        publicClient
      );

      console.log('✅ Payment completed, retrying download...');

      // Retry with payment proof
      response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/download/${shareLink}`, {
        headers: {
          'X-Payment': paymentHeader,
        },
        responseType: 'blob',
      });
    }

    // Return file blob
    return response.data;
    
  } catch (error) {
    console.error('❌ Download with x402 error:', error);
    throw error;
  }
};

/**
 * Get file info (no payment required)
 */
export const getFileInfo = async (shareLink) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files/info/${shareLink}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get file info error:', error);
    throw error;
  }
};

export default {
  uploadFileWithX402,
  downloadFileWithX402,
  getFileInfo,
};
