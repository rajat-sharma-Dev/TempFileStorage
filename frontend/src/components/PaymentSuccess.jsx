import { useState, useEffect } from 'react';
import { CheckCircle, Copy, Download, Clock, DollarSign, AlertCircle, CreditCard } from 'lucide-react';
import { formatDate, getTimeRemaining, copyToClipboard } from '../utils/helpers';
import { downloadWithX402 } from '../services/x402Payment';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import api from '../services/api';
import toast from 'react-hot-toast';

const PaymentSuccess = ({ fileData, onRetryPayment }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadPaymentStatus, setDownloadPaymentStatus] = useState(null); // Track download payment status

  // Wallet connection hooks for x402 download
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Generate backend download URL (not frontend route)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const backendBaseUrl = API_BASE_URL.replace('/api', ''); // Remove /api suffix
  const shareUrl = `${backendBaseUrl}/api/download/${fileData.shareLink}`;

  // Fetch file info to check if download payment was already made
  useEffect(() => {
    const fetchDownloadStatus = async () => {
      try {
        const response = await api.get(`/files/info/${fileData.shareLink}`);
        if (response.data.success) {
          // The backend tracks if download payment was made
          setDownloadPaymentStatus(response.data.data.paymentStatus);
        }
      } catch (error) {
        console.error('Error fetching download status:', error);
        // Default to showing "Download & Pay" if we can't fetch status
        setDownloadPaymentStatus('pending');
      }
    };

    fetchDownloadStatus();
  }, [fileData.shareLink]);

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = async () => {
    if (!isConnected || !walletClient || !publicClient || !address) {
      toast.error('Please connect your wallet to download');
      return;
    }

    try {
      setDownloading(true);
      toast.loading('Initiating download with x402 payment...', { id: 'download' });

      // Use x402 payment flow (same as Download page)
      const fileBlob = await downloadWithX402(
        fileData.shareLink, 
        walletClient, 
        publicClient, 
        address
      );
      
      // Create download link from blob
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download completed!', { id: 'download' });
      
      // Update download payment status after successful download
      setDownloadPaymentStatus('completed');
    } catch (err) {
      console.error('Download error:', err);
      
      if (err.message.includes('Insufficient USDC')) {
        toast.error('Insufficient USDC balance for payment', { id: 'download' });
      } else if (err.message.includes('rejected') || err.message.includes('denied')) {
        toast.error('Transaction rejected by user', { id: 'download' });
      } else {
        toast.error(err.message || 'Failed to download file', { id: 'download' });
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {fileData.paymentStatus === 'completed' 
            ? 'Payment Successful!' 
            : 'File Uploaded Successfully!'}
        </h2>
        <p className="text-gray-600">
          Your file has been uploaded and is ready to share
        </p>
      </div>

      {/* File Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Filename</span>
          <span className="font-semibold text-gray-900">{fileData.filename}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Storage Duration</span>
          <span className="font-semibold text-gray-900">{fileData.duration} days</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Price Paid</span>
          <span className="font-semibold text-green-600">${fileData.price} USDC</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Expires On</span>
          <span className="font-semibold text-gray-900">
            {formatDate(fileData.expiryDate)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Time Remaining</span>
          <span className="font-semibold text-primary-600">
            {getTimeRemaining(fileData.expiryDate)}
          </span>
        </div>
      </div>

      {/* Payment Status Alert */}
      {fileData.paymentStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Payment Pending</h4>
              <p className="text-sm text-yellow-700">
                Complete the payment to activate your shareable link. The file will be available for download after payment confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shareable Link */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Shareable Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="input-field flex-1 bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {copied ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this link with anyone to allow them to download your file
        </p>
      </div>

      {/* x402 Download Info - Show only if download payment not made yet */}
      {downloadPaymentStatus !== 'completed' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                x402
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Download Payment Required</h4>
              <p className="text-sm text-blue-700">
                The upload fee covers storage. A separate payment of <span className="font-semibold">${fileData.price} USDC</span> is required 
                to download the file via the x402 protocol. This payment will be processed automatically when you click download.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {fileData.paymentStatus === 'pending' && onRetryPayment && (
          <button onClick={onRetryPayment} className="btn-primary flex-1">
            <CreditCard className="w-5 h-5 inline mr-2" />
            Complete Payment
          </button>
        )}
        {fileData.paymentStatus === 'completed' && (
          <button 
            onClick={handleDownload} 
            disabled={!isConnected || downloading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 inline mr-2" />
            {!isConnected 
              ? 'Connect Wallet to Download' 
              : downloading 
                ? 'Processing...' 
                : downloadPaymentStatus === 'completed'
                  ? 'Download File'
                  : `Download & Pay $${fileData.price} USDC`}
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary flex-1"
        >
          Upload Another File
        </button>
      </div>

      {/* Important Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Important</h4>
            <p className="text-sm text-blue-700">
              This file will be automatically deleted after {fileData.duration} days. 
              {!isConnected && (
                <> Connect your wallet to download the file via x402 protocol.</>
              )}
              {isConnected && (
                <> Make sure to download it or share the link before it expires.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
