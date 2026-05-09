import { Router, Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import * as ShareService from '../services/ShareService';
import * as StorageService from '../services/StorageService';
import { normalizeUID, isValidUID } from '../services/UIDService';
import { validateSessionToken } from '../services/PasswordService';
import { retrievalLimiter } from '../middleware/rateLimiter';
import { createError } from '../middleware/errorHandler';

const router = Router();

// ─── GET /api/files/:id/download — Presigned download proxy ───
router.get(
  '/:id/download',
  retrievalLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await ShareService.getFileForDownload(req.params.id);
      if (!file) {
        throw createError('File not found or share has expired', 404);
      }

      // If the share is private, check session token
      if (file.isPrivate) {
        const token = req.headers['x-session-token'] as string;
        if (!token || !validateSessionToken(token, file.shareUid)) {
          throw createError('Authentication required', 401);
        }
      }

      // Generate presigned URL (60s TTL) and redirect
      const url = await StorageService.getPresignedDownloadUrl(file.storageKey, file.filename);
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
