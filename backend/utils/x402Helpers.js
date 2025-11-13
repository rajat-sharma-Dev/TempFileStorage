// x402 Helper Functions for Advanced Payment Handling
// Based on Coinbase x402 advanced implementation
import { exact } from 'x402/schemes';
import { useFacilitator } from 'x402/verify';
import { processPriceToAtomicAmount, findMatchingPaymentRequirements } from 'x402/shared';
import { settleResponseHeader } from 'x402/types';
import dotenv from 'dotenv';

dotenv.config();

const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const payTo = process.env.RECEIVER_WALLET_ADDRESS;

if (!payTo) {
  console.error('❌ Missing RECEIVER_WALLET_ADDRESS in environment variables');
  process.exit(1);
}

const { verify, settle } = useFacilitator({ url: facilitatorUrl });
const x402Version = 1;

/**
 * Creates payment requirements for a given price and network
 * Supports dynamic pricing based on request parameters
 * 
 * @param {string|number|Object} price - The price (e.g., "$0.05" or 0.05 or atomic amount object)
 * @param {string} network - The blockchain network (e.g., "base-sepolia")
 * @param {string} resource - The resource URL being accessed
 * @param {string} description - Description of what the payment is for
 * @returns {Object} Payment requirements object
 */
export function createExactPaymentRequirements(price, network, resource, description = '') {
  const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
  
  if ('error' in atomicAmountForAsset) {
    throw new Error(atomicAmountForAsset.error);
  }
  
  const { maxAmountRequired, asset } = atomicAmountForAsset;

  return {
    scheme: 'exact',
    network,
    maxAmountRequired,
    resource,
    description,
    mimeType: '',
    payTo: payTo,
    maxTimeoutSeconds: 120, // 2 minutes for file uploads
    asset: asset.address,
    outputSchema: undefined,
    extra: {
      name: asset.eip712.name,
      version: asset.eip712.version,
    },
  };
}

/**
 * Verifies a payment and handles the 402 response
 * Returns true if payment is valid, false otherwise (and sends 402 response)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Array} paymentRequirements - Array of payment requirements
 * @returns {Promise<boolean>} True if payment is valid
 */
export async function verifyPayment(req, res, paymentRequirements) {
  const payment = req.header('X-PAYMENT');
  
  if (!payment) {
    console.log('❌ No X-PAYMENT header found in request');
    res.status(402).json({
      x402Version,
      error: 'X-PAYMENT header is required',
      accepts: paymentRequirements,
    });
    return false;
  }

  console.log('🔍 Received X-PAYMENT header length:', payment.length);
  console.log('🔍 X-PAYMENT header (first 200 chars):', payment.substring(0, 200) + '...');
  console.log('🔍 Payment requirements:', JSON.stringify(paymentRequirements[0], null, 2));

  let decodedPayment;
  try {
    console.log('🔄 Attempting to decode payment...');
    decodedPayment = exact.evm.decodePayment(payment);
    decodedPayment.x402Version = x402Version;
    console.log('✅ Successfully decoded payment:', JSON.stringify(decodedPayment, null, 2));
  } catch (error) {
    console.error('❌ Failed to decode payment:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(402).json({
      x402Version,
      error: error?.message || 'Invalid or malformed payment header',
      accepts: paymentRequirements,
    });
    return false;
  }

  try {
    const selectedPaymentRequirement =
      findMatchingPaymentRequirements(paymentRequirements, decodedPayment) ||
      paymentRequirements[0];
      
    const response = await verify(decodedPayment, selectedPaymentRequirement);
    
    if (!response.isValid) {
      res.status(402).json({
        x402Version,
        error: response.invalidReason,
        accepts: paymentRequirements,
        payer: response.payer,
      });
      return false;
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(402).json({
      x402Version,
      error: error?.message || 'Payment verification failed',
      accepts: paymentRequirements,
    });
    return false;
  }

  return true;
}

/**
 * Settles a payment and returns the response header
 * Use this for synchronous payment processing
 * 
 * @param {string} paymentHeader - The X-PAYMENT header value
 * @param {Object} paymentRequirement - The payment requirement to settle against
 * @returns {Promise<string>} The X-PAYMENT-RESPONSE header value
 */
export async function settlePaymentSync(paymentHeader, paymentRequirement) {
  const decodedPayment = exact.evm.decodePayment(paymentHeader);
  const settleResponse = await settle(decodedPayment, paymentRequirement);
  return settleResponseHeader(settleResponse);
}

/**
 * Settles payment asynchronously (fire and forget)
 * Use this for delayed payment processing where immediate response is needed
 * 
 * @param {string} paymentHeader - The X-PAYMENT header value
 * @param {Object} paymentRequirement - The payment requirement to settle against
 * @param {Function} onSuccess - Callback for successful settlement
 * @param {Function} onError - Callback for settlement errors
 */
export function settlePaymentAsync(paymentHeader, paymentRequirement, onSuccess, onError) {
  settlePaymentSync(paymentHeader, paymentRequirement)
    .then(responseHeader => {
      if (onSuccess) onSuccess(responseHeader);
      console.log('✅ Payment settled asynchronously:', responseHeader.substring(0, 50) + '...');
    })
    .catch(error => {
      if (onError) onError(error);
      console.error('❌ Async payment settlement failed:', error);
    });
}

export default {
  createExactPaymentRequirements,
  verifyPayment,
  settlePaymentSync,
  settlePaymentAsync,
};
