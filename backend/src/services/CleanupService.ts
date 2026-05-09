import cron from 'node-cron';
import { prisma } from '../db/prisma';
import * as StorageService from './StorageService';

/**
 * CleanupService — runs every 5 minutes to purge expired shares.
 * 1. Finds all shares past their expiresAt timestamp
 * 2. Deletes associated files from R2
 * 3. Deletes DB records (cascades to File + TextShare)
 */

let isRunning = false;

async function cleanupExpiredShares(): Promise<void> {
  // Prevent overlapping runs
  if (isRunning) return;
  isRunning = true;

  try {
    const expired = await prisma.share.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
          not: null,
        },
      },
      include: {
        files: { select: { storageKey: true } },
      },
    });

    if (expired.length === 0) {
      isRunning = false;
      return;
    }

    console.log(`🧹 Cleaning up ${expired.length} expired share(s)...`);

    for (const share of expired) {
      try {
        // Delete files from R2
        if (share.files.length > 0) {
          const keys = share.files.map((f) => f.storageKey);
          await StorageService.deleteFiles(keys);
        }

        // Delete DB record (cascades to files + textShare)
        await prisma.share.delete({ where: { id: share.id } });

        console.log(`  ✓ Deleted share ${share.uid}`);
      } catch (error) {
        // Log but continue — next run will retry failed deletions
        console.error(`  ✗ Failed to clean up share ${share.uid}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Cleanup job failed:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cleanup cron job (every 5 minutes).
 */
export function startCleanupWorker(): void {
  console.log('🕐 Cleanup worker started — running every 5 minutes');

  // Run immediately on startup to catch any missed expiries
  cleanupExpiredShares();

  // Schedule recurring job
  cron.schedule('*/5 * * * *', cleanupExpiredShares);
}
