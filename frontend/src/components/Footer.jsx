const Footer = () => {
  return (
    <footer className="mt-20 py-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">
            Powered by x402 Protocol on Base Sepolia
          </p>
          <p className="text-gray-500 text-xs">
            © 2025 Temp File Storage. Files are automatically deleted after expiry.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500">
            <span>Max File Size: 100MB</span>
            <span>•</span>
            <span>Payments in USDC</span>
            <span>•</span>
            <span>Auto-Delete on Expiry</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
