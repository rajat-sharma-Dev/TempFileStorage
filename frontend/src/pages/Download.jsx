import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Download as DownloadIcon, FileText, Clock, AlertCircle, Loader, CheckCircle, Wallet } from 'lucide-react';
import api from '../services/api';
import { downloadWithX402 } from '../services/x402Payment';
import { formatFileSize, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const Download = () => {
  const { shareLink } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState(null);
  
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  useEffect(() => {
    fetchFileInfo();
  }, [shareLink]);

  const fetchFileInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/files/info/${shareLink}`);
      
      if (response.data.success) {
        setFileInfo(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch file information');
      }
    } catch (err) {
      console.error('Error fetching file info:', err);
      
      if (err.response?.status === 404) {
        setError('File not found. The link may be invalid or the file may have been deleted.');
      } else if (err.response?.status === 410) {
        setError('This file has expired and is no longer available.');
      } else {
        setError('Failed to load file information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!isConnected || !walletClient || !publicClient || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setDownloading(true);
      toast.loading('Initiating download...', { id: 'download' });

      // Use x402 payment flow
      const fileBlob = await downloadWithX402(shareLink, walletClient, publicClient, address);
      
      // Create download link from blob
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download started!', { id: 'download' });
      
      // Refresh file info to update payment status
      await fetchFileInfo();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading file information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Unable to Access File
          </h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full btn-primary"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Wallet Connection */}
        <div className="mb-6 flex justify-end">
          <ConnectButton />
        </div>

        {/* Status Banner */}
        {fileInfo.paymentStatus === 'completed' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">File Ready for Download</p>
                <p className="text-sm text-green-700">This file is available until {formatDate(fileInfo.expiryDate)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">x402 Payment Required</p>
                <p className="text-sm text-blue-700">
                  Connect your wallet and click download. Payment of ${fileInfo.price} USDC will be processed automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 p-4 rounded-full">
                <FileText className="w-12 h-12 text-primary-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {fileInfo.filename}
            </h1>
            <p className="text-gray-600">
              {fileInfo.paymentStatus === 'completed' ? 'Ready to download' : 'Pay-per-download with x402'}
            </p>
          </div>

                    {/* File Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                File Size
              </span>
              <span className="font-semibold text-gray-900">
                {formatFileSize(fileInfo.size)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Storage Duration
              </span>
              <span className="font-semibold text-gray-900">
                {fileInfo.duration} {fileInfo.duration === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Expires On
              </span>
              <span className="font-semibold text-gray-900">
                {formatDate(fileInfo.expiryDate)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-600">Price (x402)</span>
              <span className="font-bold text-primary-600 text-lg">
                ${fileInfo.price} USDC
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment Status</span>
              {fileInfo.paymentStatus === 'completed' ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ✓ Paid
                </span>
              ) : (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  💳 Pay on Download
                </span>
              )}
            </div>
          </div>

          {/* Download Button */}
          {!isConnected ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
              <Wallet className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Connect Wallet to Download
              </h3>
              <p className="text-blue-700 mb-4">
                Connect your wallet to download this file. 
                {fileInfo.paymentStatus !== 'completed' && (
                  <> Payment of ${fileInfo.price} USDC will be processed automatically via x402 protocol.</>
                )}
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full btn-primary text-lg py-4"
            >
              {downloading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <DownloadIcon className="w-5 h-5" />
                  {fileInfo.paymentStatus === 'completed' 
                    ? 'Download File' 
                    : `Download & Pay $${fileInfo.price} USDC`}
                </span>
              )}
            </button>
          )}

          {/* x402 Info */}
          {fileInfo.paymentStatus !== 'completed' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    x402
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Powered by x402 Protocol</h4>
                  <p className="text-sm text-gray-600">
                    Automated Web3 payments. Click download and the payment will be processed seamlessly via the x402 protocol.
                    Your transaction will be verified on Base Sepolia network.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              This link will expire on {formatDate(fileInfo.expiryDate)}
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            ← Upload Another File
          </button>
        </div>
      </div>
    </div>
  );
};

export default Download;
