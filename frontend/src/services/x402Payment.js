// x402 Payment Service - True x402 Protocol Implementation
// Version: 2.0.0 - Updated: 2025-11-13
import { parseUnits } from 'viem';

// Base Sepolia USDC contract address
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// x402 configuration
const X402_CONFIG = {
  facilitatorUrl: 'https://x402.org/facilitator',
  receiverAddress: import.meta.env.VITE_RECEIVER_WALLET_ADDRESS || '0xbc86ca947ab27b990054870566cfe849c2109d2d',
  network: 'base-sepolia',
  chainId: 84532, // Base Sepolia
};

/**
 * Parse x402 payment challenge from 402 response headers
 * @param {Response} response - Fetch API response object
 * @returns {Object} Payment challenge data
 */
export const parsePaymentChallenge = (response) => {
  const challenge = {
    amount: response.headers.get('X-Payment-Amount'),
    currency: response.headers.get('X-Payment-Currency'),
    receiver: response.headers.get('X-Payment-Receiver'),
    network: response.headers.get('X-Payment-Network'),
    chainId: response.headers.get('X-Payment-Chain-Id'),
    description: response.headers.get('X-Payment-Description'),
    nonce: response.headers.get('X-Payment-Nonce'),
  };

  const metadataHeader = response.headers.get('X-Payment-Metadata');
  if (metadataHeader) {
    try {
      challenge.metadata = JSON.parse(metadataHeader);
    } catch (e) {
      console.error('Failed to parse metadata:', e);
    }
  }

  return challenge;
};

/**
 * Handle x402 payment flow from a 402 response
 * @param {Response} response - 402 response from download attempt
 * @param {Object} walletClient - Viem wallet client
 * @param {Object} publicClient - Viem public client
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Object>} Payment proof with transaction hash
 */
export const handleX402Payment = async (response, walletClient, publicClient, userAddress) => {
  try {
    console.log('Handling x402 payment challenge...');

    // Parse the payment challenge from headers
    const challenge = parsePaymentChallenge(response);
    console.log('Payment challenge:', challenge);

    if (!challenge.amount || !challenge.receiver) {
      throw new Error('Invalid payment challenge - missing required fields');
    }

    // Convert USD amount to USDC (6 decimals)
    const amountInUsdc = parseUnits(challenge.amount, 6);

    // USDC ERC-20 ABI (minimal for transfer)
    const usdcAbi = [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ];

    // Check USDC balance
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    console.log('USDC Balance:', balance.toString(), 'Required:', amountInUsdc.toString());

    if (balance < amountInUsdc) {
      throw new Error(
        `Insufficient USDC balance. You need ${challenge.amount} USDC but have ${(Number(balance) / 1e6).toFixed(6)} USDC`
      );
    }

    // Execute USDC transfer
    console.log('Executing USDC transfer...', {
      to: challenge.receiver,
      amount: amountInUsdc.toString(),
    });

    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'transfer',
      args: [challenge.receiver, amountInUsdc],
      account: userAddress,
      chain: {
        id: parseInt(challenge.chainId),
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://sepolia.base.org'] },
          public: { http: ['https://sepolia.base.org'] },
        },
        blockExplorers: {
          default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
        },
      },
    });

    console.log('Transaction submitted:', txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    console.log('Transaction confirmed:', receipt);

    // Create payment proof for x402 protocol
    const paymentProof = {
      transactionHash: txHash,
      fileId: challenge.metadata?.fileId,
      amount: challenge.amount,
      currency: challenge.currency,
      receiver: challenge.receiver,
      network: challenge.network,
      chainId: challenge.chainId,
      sender: userAddress,
      nonce: challenge.nonce,
      timestamp: Date.now(),
      blockNumber: receipt.blockNumber.toString(),
      status: receipt.status,
    };

    return {
      success: true,
      transactionHash: txHash,
      paymentProof,
      receipt,
    };
  } catch (error) {
    console.error('x402 payment error:', error);
    throw error;
  }
};

/**
 * Download file with x402 payment flow
 * @param {string} shareLink - File share link
 * @param {Object} walletClient - Viem wallet client
 * @param {Object} publicClient - Viem public client
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Blob>} File blob
 */
export const downloadWithX402 = async (shareLink, walletClient, publicClient, userAddress) => {
  try {
    const downloadUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/download/${shareLink}`;

    // First attempt - will likely return 402
    console.log('Attempting download...', downloadUrl);
    let response = await fetch(downloadUrl);

    // If we get 402, handle payment and retry
    if (response.status === 402) {
      console.log('Received 402 Payment Required - initiating payment flow');
      
      // Handle the x402 payment
      const paymentResult = await handleX402Payment(response, walletClient, publicClient, userAddress);
      
      console.log('Payment completed, retrying download with proof...');
      
      // Retry download with payment proof
      response = await fetch(downloadUrl, {
        headers: {
          'X-Payment-Proof': JSON.stringify(paymentResult.paymentProof),
        },
      });
    }

    // Check if download succeeded
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }

    // Return the file blob
    return await response.blob();
  } catch (error) {
    console.error('Download with x402 error:', error);
    throw error;
  }
};

/**
 * Upload file with x402 payment flow
 * @param {FormData} formData - Form data containing file and duration
 * @param {Object} walletClient - Viem wallet client
 * @param {Object} publicClient - Viem public client
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Object>} Upload result data
 */
export const uploadWithX402 = async (formData, walletClient, publicClient, userAddress) => {
  try {
    const uploadUrl = `${import.meta.env.VITE_API_URL}/files/upload`;

    // First attempt - will return 402 since no payment proof provided
    console.log('Attempting upload...', uploadUrl);
    let response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    // If we get 402, handle payment and retry
    if (response.status === 402) {
      console.log('Received 402 Payment Required - initiating payment flow');
      
      // Handle the x402 payment
      const paymentResult = await handleX402Payment(response, walletClient, publicClient, userAddress);
      
      console.log('Payment completed, retrying upload with proof...');
      
      // Retry upload with payment proof - send only the transaction hash
      response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'X-Payment-Proof': paymentResult.transactionHash,
        },
        body: formData,
      });
    }

    // Check if upload succeeded
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    // Return the upload result
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Upload with x402 error:', error);
    throw error;
  }
};

/**
 * Initiate x402 payment (legacy support for direct payment flow)
 * @param {Object} params - Payment parameters
 * @param {string} params.fileId - File ID
 * @param {number} params.amount - Amount in USD
 * @param {Object} params.walletClient - Viem wallet client (for writing)
 * @param {Object} params.publicClient - Viem public client (for reading)
 * @param {string} params.userAddress - User's wallet address
 * @returns {Promise<Object>} Payment result with transaction hash
 */
export const initiateX402Payment = async ({ fileId, amount, walletClient, publicClient, userAddress }) => {
  try {
    console.log('Initiating x402 payment...', { fileId, amount, userAddress });

    // Convert USD amount to USDC (6 decimals)
    const amountInUsdc = parseUnits(amount.toString(), 6);

    // USDC ERC-20 ABI (minimal for transfer)
    const usdcAbi = [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ];

    // Check USDC balance first using publicClient
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    console.log('USDC Balance:', balance.toString());

    if (balance < amountInUsdc) {
      throw new Error(
        `Insufficient USDC balance. You need ${amount} USDC but have ${(Number(balance) / 1e6).toFixed(6)} USDC`
      );
    }

    // Prepare x402 payment data
    const paymentData = {
      fileId,
      amount: amount.toString(),
      token: 'USDC',
      network: X402_CONFIG.network,
      receiver: X402_CONFIG.receiverAddress,
      timestamp: Date.now(),
    };

    // Execute USDC transfer via x402 protocol
    console.log('Executing USDC transfer...', {
      to: X402_CONFIG.receiverAddress,
      amount: amountInUsdc.toString(),
    });

    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'transfer',
      args: [X402_CONFIG.receiverAddress, amountInUsdc],
      account: userAddress,
      chain: {
        id: X402_CONFIG.chainId,
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://sepolia.base.org'] },
          public: { http: ['https://sepolia.base.org'] },
        },
        blockExplorers: {
          default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
        },
      },
    });

    console.log('Transaction hash:', txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    console.log('Transaction confirmed:', receipt);

    return {
      success: true,
      transactionHash: txHash,
      paymentData,
      receipt,
    };
  } catch (error) {
    console.error('Payment error:', error);

    // Extract meaningful error message
    let errorMessage = 'Payment failed';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.shortMessage) {
      errorMessage = error.shortMessage;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Get x402 configuration
 */
export const getX402Config = () => X402_CONFIG;

/**
 * Format transaction URL for block explorer
 */
export const getTransactionUrl = (txHash) => {
  return `https://sepolia.basescan.org/tx/${txHash}`;
};

/**
 * Get USDC contract address
 */
export const getUsdcAddress = () => USDC_ADDRESS;

export default {
  initiateX402Payment,
  handleX402Payment,
  parsePaymentChallenge,
  downloadWithX402,
  uploadWithX402,
  getX402Config,
  getTransactionUrl,
  getUsdcAddress,
};
