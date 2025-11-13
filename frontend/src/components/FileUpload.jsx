import { useState, useRef } from 'react';
import { Upload, File, X, Wallet } from 'lucide-react';
import { validateFile, formatFileSize, PRICING_INFO } from '../utils/helpers';
import { uploadFileWithX402 } from '../services/x402Service';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import toast from 'react-hot-toast';

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [duration, setDuration] = useState(7);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Wallet connection hooks from RainbowKit/wagmi
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    // Check wallet connection
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!walletClient) {
      toast.error('Wallet not ready. Please try again.');
      return;
    }

    if (!publicClient) {
      toast.error('Network connection not ready. Please try again.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('duration', duration);

    try {
      // Use x402-axios for automatic payment handling
      toast.loading('Processing payment...', { id: 'upload' });
      
      const data = await uploadFileWithX402(
        formData,
        walletClient,
        publicClient,
        address
      );

      toast.success('File uploaded!', { id: 'upload' });
      onUploadSuccess(data);
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file', { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const selectedPricing = PRICING_INFO[duration];

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Upload Your File</h2>

      {/* Wallet Status Indicator */}
      {isConnected && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full font-semibold">
            x402 Payment Ready
          </span>
        </div>
      )}

      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <Wallet className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-700 font-medium">
            Connect your wallet to upload files and make payments
          </span>
        </div>
      )}

      {/* File Drop Zone */}
      <div
        className={`border-3 border-dashed rounded-lg p-8 text-center transition-colors ${
          selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-primary-500 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-700 mb-2">
              Drag and drop your file here
            </p>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <label className="btn-primary cursor-pointer inline-block">
              Browse Files
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Maximum file size: 100MB
            </p>
          </>
        ) : (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-primary-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700"
              disabled={uploading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Duration Selection */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Storage Duration
        </label>
        <div className="grid grid-cols-3 gap-4">
          {Object.values(PRICING_INFO).map((option) => (
            <button
              key={option.days}
              onClick={() => setDuration(option.days)}
              disabled={uploading}
              className={`p-4 rounded-lg border-2 transition-all ${
                duration === option.days
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-300'
              } disabled:opacity-50`}
            >
              <div className="text-lg font-bold text-gray-900">
                {option.label}
              </div>
              <div className="text-sm text-primary-600 font-semibold mt-1">
                ${option.price} USDC
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading || !isConnected}
        className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isConnected ? (
          <>
            <Wallet className="inline w-5 h-5 mr-2" />
            Connect Wallet to Upload
          </>
        ) : uploading ? (
          'Processing Payment & Upload...'
        ) : (
          `Pay & Upload - $${selectedPricing.price} USDC`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        {!isConnected ? (
          'Connect your wallet to upload and pay with USDC via x402 protocol'
        ) : (
          <>
            By uploading, you agree to pay <span className="font-semibold">${selectedPricing.price} USDC</span> for{' '}
            <span className="font-semibold">{selectedPricing.days} day(s)</span> of storage
          </>
        )}
      </p>
    </div>
  );
};

export default FileUpload;
