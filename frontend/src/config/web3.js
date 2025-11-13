import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Temp File Storage',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [baseSepolia],
  ssr: false,
});

// USDC contract address on Base Sepolia
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// x402 configuration
export const X402_CONFIG = {
  facilitatorUrl: 'https://x402.org/facilitator',
  network: 'base-sepolia',
  receiverAddress: import.meta.env.VITE_RECEIVER_WALLET_ADDRESS || '0xfc23834846a42ed1edc70f253cf1919c93eaba16',
};
