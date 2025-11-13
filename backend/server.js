import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { paymentMiddleware } from 'x402-express';
import pool, { initializeDatabase } from './config/database.js';
import fileRoutes from './routes/fileRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';
import { startFileCleanupScheduler } from './utils/scheduler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// x402 Payment Middleware Configuration
// Note: Upload route uses manual x402 implementation for dynamic pricing
// Only download route uses middleware for simplicity
app.use(
  paymentMiddleware(
    process.env.RECEIVER_WALLET_ADDRESS,
    {
      // Protected download routes with dynamic pricing
      'GET /api/download/:shareLink': {
        price: '$0.05', // This will be overridden by actual file price
        network: process.env.X402_NETWORK || 'base-sepolia',
        config: {
          description: 'Download temporary file',
          maxTimeoutSeconds: 120,
        },
      },
    },
    {
      url: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
    }
  )
);

// API Routes
app.use('/api/files', fileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/download', downloadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Temp File Storage API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      upload: 'POST /api/files/upload',
      fileInfo: 'GET /api/files/info/:shareLink',
      allFiles: 'GET /api/files/all',
      initiatePayment: 'POST /api/payments/initiate',
      completePayment: 'POST /api/payments/complete',
      paymentStatus: 'GET /api/payments/status/:fileId',
      download: 'GET /api/download/:shareLink',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File size too large. Maximum size is 100MB',
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Initialize database tables
    await initializeDatabase();

    // Start file cleanup scheduler
    startFileCleanupScheduler();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}`);
      console.log(`💰 x402 Payment Network: ${process.env.X402_NETWORK}`);
      console.log(`🔐 Receiver Wallet: ${process.env.RECEIVER_WALLET_ADDRESS}`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   Health Check: GET http://localhost:${PORT}/api/health`);
      console.log(`   Upload File:  POST http://localhost:${PORT}/api/files/upload`);
      console.log(`   File Info:    GET http://localhost:${PORT}/api/files/info/:shareLink`);
      console.log(`   Download:     GET http://localhost:${PORT}/api/download/:shareLink`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startServer();
