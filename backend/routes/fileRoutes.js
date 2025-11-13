import express from 'express';
import upload from '../config/upload.js';
import * as fileModel from '../models/fileModel.js';
import * as paymentModel from '../models/paymentModel.js';
import * as transactionModel from '../models/transactionModel.js';
import { getPriceForDuration, isValidDuration } from '../config/pricing.js';
import { generateShareLink, calculateExpiryDate, validateFileUpload, isFileExpired } from '../utils/helpers.js';
import { createExactPaymentRequirements, verifyPayment, settlePaymentSync } from '../utils/x402Helpers.js';
import fs from 'fs';

const router = express.Router();

// Upload file endpoint - Protected by x402 protocol with dynamic pricing
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { duration } = req.body;
    const file = req.file;

    // Validate file
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.valid) {
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ error: fileValidation.error });
    }

    // Validate duration
    if (!duration || !isValidDuration(parseInt(duration))) {
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ 
        error: 'Invalid duration. Must be 1, 7, or 30 days' 
      });
    }

    const durationDays = parseInt(duration);
    const priceUsd = getPriceForDuration(durationDays);

    // Create resource URL for x402
    const resource = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
    
    // Create payment requirements with dynamic pricing based on duration
    const paymentRequirements = [
      createExactPaymentRequirements(
        `$${priceUsd}`, // Dynamic price based on duration
        'base-sepolia',
        resource,
        `Upload file for ${durationDays} day(s) - ${file.originalname}`
      ),
    ];

    // Verify payment using x402 advanced implementation
    const isValid = await verifyPayment(req, res, paymentRequirements);
    if (!isValid) {
      // verifyPayment already sent the 402 response
      // Clean up the uploaded file since payment failed
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      console.log('❌ Payment verification failed - file cleaned up');
      return;
    }

    // Payment is valid - process upload
    console.log(`✅ Payment verified for file: ${file.originalname}, Price: $${priceUsd}`);

    try {
      // Settle payment synchronously and get response header
      const responseHeader = await settlePaymentSync(
        req.header('X-PAYMENT'),
        paymentRequirements[0]
      );
      
      // Set the payment response header
      res.setHeader('X-PAYMENT-RESPONSE', responseHeader);

      // Generate unique share link
      const shareLink = generateShareLink();
      const expiryDate = calculateExpiryDate(durationDays);

      // Create file record
      const fileData = {
        filename: file.filename,
        originalFilename: file.originalname,
        filepath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        durationDays,
        priceUsd,
        shareLink,
        expiryDate,
      };

      const createdFile = await fileModel.createFile(fileData);

      // Create payment record with transaction hash
      await paymentModel.createPayment({
        fileId: createdFile.id,
        amountUsd: priceUsd,
        paymentStatus: 'completed',
        transactionHash: responseHeader.substring(0, 100), // Store part of response header
      });

      // Log transaction
      await transactionModel.createTransaction({
        fileId: createdFile.id,
        eventType: 'file_uploaded',
        eventData: {
          filename: file.originalname,
          size: file.size,
          duration: durationDays,
          price: priceUsd,
          paymentSettled: true,
        },
      });

      console.log(`✅ Upload successful: ${shareLink}`);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileId: createdFile.id,
          filename: createdFile.original_filename,
          size: createdFile.file_size,
          duration: createdFile.duration_days,
          price: createdFile.price_usd,
          shareLink: createdFile.share_link,
          expiryDate: createdFile.expiry_date,
          paymentStatus: 'completed',
        },
      });
    } catch (settleError) {
      console.error('❌ Payment settlement error:', settleError);
      
      // Clean up file
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      
      res.status(402).json({
        x402Version: 1,
        error: settleError?.message || 'Payment settlement failed',
        accepts: paymentRequirements,
      });
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    
    // Clean up file if error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file info by share link (no payment required)
router.get('/info/:shareLink', async (req, res) => {
  try {
    const { shareLink } = req.params;
    const file = await fileModel.getFileByShareLink(shareLink);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (isFileExpired(file.expiry_date)) {
      return res.status(410).json({ error: 'File has expired' });
    }

    res.json({
      success: true,
      data: {
        fileId: file.id,
        filename: file.original_filename,
        size: file.file_size,
        mimeType: file.mime_type,
        duration: file.duration_days,
        price: file.price_usd,
        shareLink: file.share_link,
        expiryDate: file.expiry_date,
        paymentStatus: file.payment_status,
        createdAt: file.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching file info:', error);
    res.status(500).json({ error: 'Failed to fetch file info' });
  }
});

// Get all files (admin/debug endpoint)
router.get('/all', async (req, res) => {
  try {
    const files = await fileModel.getAllFiles();
    res.json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

export default router;
