import { Upload, FileText, Clock, DollarSign } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Hero = () => {
  return (
    <div className="text-center mb-12">
      {/* Wallet Connect Button */}
      <div className="flex justify-end mb-4">
        <ConnectButton />
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="bg-primary-100 p-4 rounded-full">
          <Upload className="w-12 h-12 text-primary-600" />
        </div>
      </div>
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        Temporary File Storage
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Upload files securely, pay with crypto, and get a shareable link. Files auto-delete after expiry.
      </p>
      
      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <FileText className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
          <p className="text-gray-600 text-sm">
            Upload files up to 100MB with just a few clicks
          </p>
        </div>
        
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <DollarSign className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Crypto Payments</h3>
          <p className="text-gray-600 text-sm">
            Pay with USDC via x402 protocol on Base Sepolia
          </p>
        </div>
        
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <Clock className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Auto-Delete</h3>
          <p className="text-gray-600 text-sm">
            Files automatically deleted after expiry date
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
