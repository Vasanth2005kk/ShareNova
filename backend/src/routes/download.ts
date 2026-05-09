import { Router, Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import { Readable } from 'stream';
import * as ShareService from '../services/ShareService';
import * as StorageService from '../services/StorageService';
import { normalizeUID, isValidUID } from '../services/UIDService';
import { validateSessionToken } from '../services/PasswordService';
import { retrievalLimiter } from '../middleware/rateLimiter';
import { createError } from '../middleware/errorHandler';

const router = Router();

// ─── GET /api/download/:uid/all — ZIP stream of all files ───
router.get(
  '/:uid/all',
  retrievalLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = normalizeUID(req.params.uid);
      if (!isValidUID(uid)) {
        throw createError('Invalid UID format', 400);
      }

      // Get share metadata to check privacy
      const share = await ShareService.getShareByUID(uid);
      if (!share) {
        throw createError('Share not found or has expired', 404);
      }

      // Auth check for private shares
      if (share.isPrivate) {
        const token = req.headers['x-session-token'] as string;
        if (!token || !validateSessionToken(token, uid)) {
          throw createError('Authentication required', 401);
        }
      }

      // Get all files for this share
      const files = await ShareService.getShareFiles(uid);
      if (!files || files.length === 0) {
        throw createError('No files found for this share', 404);
      }

      // Set up ZIP streaming response
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="sharenova-${uid}.zip"`);

      const archive = archiver('zip', { zlib: { level: 5 } });
      archive.pipe(res);

      // Stream each file from R2 into the ZIP
      for (const file of files) {
        const stream = await StorageService.getFileStream(file.storageKey);
        if (stream) {
          archive.append(stream as Readable, { name: file.filename });
        }
      }

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
