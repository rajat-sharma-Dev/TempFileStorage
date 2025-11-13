import cron from 'node-cron';
import fs from 'fs';
import { getExpiredFiles, deleteFileById } from '../models/fileModel.js';
import { createTransaction } from '../models/transactionModel.js';

// Run every hour to check for expired files
export const startFileCleanupScheduler = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('🧹 Running file cleanup scheduler...');
    
    try {
      const expiredFiles = await getExpiredFiles();
      
      if (expiredFiles.length === 0) {
        console.log('✅ No expired files to clean up');
        return;
      }

      console.log(`Found ${expiredFiles.length} expired files to delete`);

      for (const file of expiredFiles) {
        try {
          // Delete physical file
          if (fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
            console.log(`🗑️  Deleted file: ${file.filepath}`);
          }

          // Log transaction
          await createTransaction({
            fileId: file.id,
            eventType: 'file_deleted',
            eventData: {
              filename: file.original_filename,
              reason: 'expired',
              expiry_date: file.expiry_date,
            },
          });

          // Delete from database
          await deleteFileById(file.id);
          console.log(`✅ Deleted file record from database: ${file.id}`);
        } catch (error) {
          console.error(`❌ Error deleting file ${file.id}:`, error);
        }
      }

      console.log('✅ File cleanup completed');
    } catch (error) {
      console.error('❌ Error in file cleanup scheduler:', error);
    }
  });

  console.log('✅ File cleanup scheduler started (runs every hour)');
};

// Manual cleanup function (can be called anytime)
export const manualCleanup = async () => {
  console.log('🧹 Running manual file cleanup...');
  
  try {
    const expiredFiles = await getExpiredFiles();
    
    if (expiredFiles.length === 0) {
      return { success: true, message: 'No expired files to clean up', deletedCount: 0 };
    }

    let deletedCount = 0;
    const errors = [];

    for (const file of expiredFiles) {
      try {
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }

        await createTransaction({
          fileId: file.id,
          eventType: 'file_deleted',
          eventData: {
            filename: file.original_filename,
            reason: 'manual_cleanup',
            expiry_date: file.expiry_date,
          },
        });

        await deleteFileById(file.id);
        deletedCount++;
      } catch (error) {
        errors.push({ fileId: file.id, error: error.message });
      }
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} expired files`,
      deletedCount,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error in manual cleanup',
      error: error.message,
    };
  }
};
