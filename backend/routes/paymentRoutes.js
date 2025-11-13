import express from 'express';
import * as fileModel from '../models/fileModel.js';
import * as paymentModel from '../models/paymentModel.js';
import * as transactionModel from '../models/transactionModel.js';
import { isFileExpired } from '../utils/helpers.js';

const router = express.Router();

// Initiate payment endpoint (returns file info for payment)
router.post('/initiate', async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const file = await fileModel.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.payment_status === 'completed') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Check if file is expired
    if (isFileExpired(file.expiry_date)) {
      return res.status(410).json({ error: 'File has expired' });
    }

    const payment = await paymentModel.getPaymentByFileId(fileId);

    res.json({
      success: true,
      message: 'Payment initiated',
      data: {
        fileId: file.id,
        filename: file.original_filename,
        price: file.price_usd,
        duration: file.duration_days,
        shareLink: file.share_link,
        paymentId: payment.id,
        paymentStatus: payment.payment_status,
      },
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Complete payment endpoint (called after x402 payment verification)
router.post('/complete', async (req, res) => {
  try {
    const { fileId, transactionHash, paymentData } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const file = await fileModel.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.payment_status === 'completed') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Update payment status
    const payment = await paymentModel.getPaymentByFileId(fileId);
    await paymentModel.updatePaymentStatus(
      payment.id,
      'completed',
      transactionHash,
      paymentData
    );

    // Update file payment status
    await fileModel.updateFilePaymentStatus(fileId, 'completed');

    // Log transaction
    await transactionModel.createTransaction({
      fileId: file.id,
      paymentId: payment.id,
      eventType: 'payment_completed',
      eventData: {
        transactionHash,
        amount: file.price_usd,
        paymentData,
      },
    });

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        fileId: file.id,
        shareLink: file.share_link,
        paymentStatus: 'completed',
      },
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({ error: 'Failed to complete payment' });
  }
});

// Get payment status
router.get('/status/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await fileModel.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const payment = await paymentModel.getPaymentByFileId(fileId);

    res.json({
      success: true,
      data: {
        fileId: file.id,
        paymentStatus: file.payment_status,
        amount: payment.amount_usd,
        transactionHash: payment.transaction_hash,
        paidAt: payment.paid_at,
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

export default router;
