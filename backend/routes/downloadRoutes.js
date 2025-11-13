import express from 'express';
import * as fileModel from '../models/fileModel.js';
import * as paymentModel from '../models/paymentModel.js';
import { isFileExpired } from '../utils/helpers.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

// Generate x402 payment challenge
const generatePaymentChallenge = (file) => {
  const challenge = {
    amount: file.price_usd.toString(),
    currency: 'USDC',
    receiver: process.env.RECEIVER_WALLET_ADDRESS,
    network: 'base-sepolia',
    chainId: '84532',
    description: `Download ${file.original_filename}`,
    metadata: {
      fileId: file.id,
      shareLink: file.share_link,
      filename: file.original_filename,
      size: file.file_size,
      duration: file.duration_days,
    },
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  };
  
  return challenge;
};

// Download file by share link (protected by x402 payment)
router.get('/:shareLink', async (req, res) => {
  try {
    const { shareLink } = req.params;
    const paymentProof = req.headers['x-payment-proof'];

    const file = await fileModel.getFileByShareLink(shareLink);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is expired
    if (isFileExpired(file.expiry_date)) {
      return res.status(410).json({ error: 'File has expired and is no longer available' });
    }

    // If payment proof is provided, verify it
    if (paymentProof) {
      try {
        const proof = JSON.parse(paymentProof);
        
        // Verify the transaction hash matches the file
        if (proof.fileId === file.id && proof.transactionHash) {
          // Update payment status if not already completed
          if (file.payment_status !== 'completed') {
            const payment = await paymentModel.getPaymentByFileId(file.id);
            await paymentModel.updatePaymentStatus(
              payment.id,
              'completed',
              proof.transactionHash,
              proof
            );
            await fileModel.updateFilePaymentStatus(file.id, 'completed');
          }
          
          // Payment verified, serve the file
          if (!fs.existsSync(file.filepath)) {
            return res.status(404).json({ error: 'File not found on server' });
          }

          res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
          res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
          res.setHeader('Content-Length', file.file_size);

          const fileStream = fs.createReadStream(file.filepath);
          fileStream.pipe(res);

          fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Error downloading file' });
            }
          });
          return;
        }
      } catch (error) {
        console.error('Error verifying payment proof:', error);
      }
    }

    // Check if payment is already completed (for returning users)
    if (file.payment_status === 'completed') {
      if (!fs.existsSync(file.filepath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
      res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
      res.setHeader('Content-Length', file.file_size);

      const fileStream = fs.createReadStream(file.filepath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error downloading file' });
        }
      });
      return;
    }

    // Payment required - return 402 with x402 challenge headers
    const challenge = generatePaymentChallenge(file);
    
    res.status(402)
      .setHeader('WWW-Authenticate', 'X402')
      .setHeader('X-Payment-Required', 'true')
      .setHeader('X-Payment-Amount', challenge.amount)
      .setHeader('X-Payment-Currency', challenge.currency)
      .setHeader('X-Payment-Receiver', challenge.receiver)
      .setHeader('X-Payment-Network', challenge.network)
      .setHeader('X-Payment-Chain-Id', challenge.chainId)
      .setHeader('X-Payment-Description', challenge.description)
      .setHeader('X-Payment-Metadata', JSON.stringify(challenge.metadata))
      .setHeader('X-Payment-Nonce', challenge.nonce)
      .setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate, X-Payment-Required, X-Payment-Amount, X-Payment-Currency, X-Payment-Receiver, X-Payment-Network, X-Payment-Chain-Id, X-Payment-Description, X-Payment-Metadata, X-Payment-Nonce')
      .json({
        error: 'Payment Required',
        message: 'This resource requires payment',
        challenge,
      });

  } catch (error) {
    console.error('Error downloading file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download file' });
    }
  }
});

export default router;
