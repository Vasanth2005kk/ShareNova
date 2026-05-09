import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import * as ShareService from '../services/ShareService';
import { isValidUID, normalizeUID, formatUID } from '../services/UIDService';
import { verifyPassword, createSessionToken, validateSessionToken } from '../services/PasswordService';
import { uploadLimiter, retrievalLimiter, passwordLimiter } from '../middleware/rateLimiter';
import { mimeValidator } from '../middleware/mimeValidator';
import { validateBody } from '../middleware/validateBody';
import { createError } from '../middleware/errorHandler';
import { env } from '../config/env';

const router = Router();

// ─── Multer config ──────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
    files: 20, // max 20 files per upload
  },
});

// ─── Validation schemas ─────────────────────────────────
const textShareSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1, 'Content is required').max(500000, 'Content too large (max 500KB)'),
  language: z.string().max(50).optional(),
  expiresIn: z.enum(['1h', '6h', '24h', '7d', '30d']).optional(),
  password: z.string().min(4).max(128).optional(),
});

const verifySchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// ─── POST /api/shares/file — Create file share ─────────
router.post(
  '/file',
  uploadLimiter,
  upload.array('files', 20),
  mimeValidator,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw createError('No files uploaded', 400);
      }

      // Calculate total size
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > env.MAX_UPLOAD_BYTES) {
        throw createError(`Total upload size exceeds ${env.MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit`, 400);
      }

      const input: ShareService.CreateFileShareInput = {
        files: files.map((f) => ({
          filename: f.originalname,
          buffer: f.buffer,
          mimeType: f.mimetype,
          size: f.size,
        })),
        expiresIn: req.body.expiresIn,
        password: req.body.password,
      };

      const uid = await ShareService.createFileShare(input);

      res.status(201).json({
        success: true,
        data: {
          uid,
          formattedUID: formatUID(uid),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /api/shares/text — Create text share ─────────
router.post(
  '/text',
  uploadLimiter,
  validateBody(textShareSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = await ShareService.createTextShare(req.body);

      res.status(201).json({
        success: true,
        data: {
          uid,
          formattedUID: formatUID(uid),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/shares/:uid — Get share metadata ─────────
router.get(
  '/:uid',
  retrievalLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = normalizeUID(req.params.uid);
      if (!isValidUID(uid)) {
        throw createError('Invalid UID format — must be 12 digits', 400);
      }

      const share = await ShareService.getShareByUID(uid);
      if (!share) {
        throw createError('Share not found or has expired', 404);
      }

      res.json({
        success: true,
        data: share,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /api/shares/:uid/verify — Password verify ────
router.post(
  '/:uid/verify',
  passwordLimiter,
  validateBody(verifySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = normalizeUID(req.params.uid);
      if (!isValidUID(uid)) {
        throw createError('Invalid UID format', 400);
      }

      const hash = await ShareService.getSharePasswordHash(uid);
      if (!hash) {
        throw createError('Share not found or is not password-protected', 404);
      }

      const isValid = await verifyPassword(req.body.password, hash);
      if (!isValid) {
        throw createError('Incorrect password', 401);
      }

      // Create a short-lived session token
      const sessionToken = createSessionToken(uid);

      res.json({
        success: true,
        data: { sessionToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/shares/:uid/content — Get text content ───
router.get(
  '/:uid/content',
  retrievalLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = normalizeUID(req.params.uid);
      if (!isValidUID(uid)) {
        throw createError('Invalid UID format', 400);
      }

      // Check if share exists and if auth is needed
      const share = await ShareService.getShareByUID(uid);
      if (!share) {
        throw createError('Share not found or has expired', 404);
      }

      // If private, validate session token
      if (share.isPrivate) {
        const token = req.headers['x-session-token'] as string;
        if (!token || !validateSessionToken(token, uid)) {
          throw createError('Authentication required — verify password first', 401);
        }
      }

      const content = await ShareService.getTextContent(uid);
      if (!content) {
        throw createError('Text content not found', 404);
      }

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
