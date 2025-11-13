import { useState } from 'react';
import { CreditCard, Wallet, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { initiateX402Payment, getTransactionUrl } from '../services/x402Payment';
import toast from 'react-hot-toast';
import api from '../services/api';

const PaymentModal = ({ fileData, onPaymentSuccess, onCancel }) => {
  const [processing, setProcessing] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handlePayment = async () => {
    if (!isConnected || !walletClient) {
      toast.error('Please connect your wallet first');
      return;
    }

    setProcessing(true);
    setTxHash(null);

    try {
      // Initiate x402 payment
      toast.loading('Preparing payment...', { id: 'payment' });
      
      const paymentResult = await initiateX402Payment({
        fileId: fileData.fileId || fileData.id,
        amount: fileData.price,
        walletClient,
        publicClient,
        userAddress: address,
      });

      if (!paymentResult.success) {
        toast.error(paymentResult.error || 'Payment failed', { id: 'payment' });
        return;
      }

      setTxHash(paymentResult.transactionHash);
      toast.success('Payment successful!', { id: 'payment' });

      // Complete payment on backend
      const response = await api.post('/payments/complete', {
        fileId: fileData.fileId || fileData.id,
        transactionHash: paymentResult.transactionHash,
        paymentData: paymentResult.paymentData,
      });

      if (response.data.success) {
        onPaymentSuccess(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to complete payment');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'Payment failed. Please try again.', { id: 'payment' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 p-3 rounded-full">
              <CreditCard className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Payment
          </h2>
          <p className="text-gray-600">
            Pay with USDC to get your shareable link
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">File</span>
            <span className="font-semibold text-gray-900 truncate max-w-[200px]">
              {fileData.filename}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Storage Duration</span>
            <span className="font-semibold text-gray-900">
              {fileData.duration} {fileData.duration === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-primary-600">
              ${fileData.price} USDC
            </span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Payment via x402 Protocol</p>
              <p className="text-blue-700">
                You'll be prompted to approve the USDC payment transaction in your wallet.
                The payment will be processed on Base Sepolia testnet.
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!isConnected ? (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Wallet Required</p>
                  <p className="text-yellow-700">
                    Please connect your Web3 wallet to make the payment.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <>
            {/* Connected Wallet Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">Wallet Connected</p>
                  <p className="text-green-700 font-mono text-xs">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Hash */}
            {txHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Transaction Submitted</p>
                    <a
                      href={getTransactionUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono text-xs underline"
                    >
                      View on Block Explorer →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Demo Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Demo Mode Active</p>
              <p className="text-yellow-700">
                This is currently simulating the x402 payment flow. 
                In production, you'll connect your Web3 wallet to make real USDC payments.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            className="flex-1 btn-primary"
            disabled={processing || !isConnected}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5" />
                Pay ${fileData.price} USDC
              </span>
            )}
          </button>
        </div>

        {/* Network Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Network: <span className="font-semibold">Base Sepolia</span> • 
            Receiver: <span className="font-mono text-xs">0xfc2383...aba16</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
