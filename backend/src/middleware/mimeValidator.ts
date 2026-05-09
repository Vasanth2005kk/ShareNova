import { Request, Response, NextFunction } from 'express';
import { fileTypeFromBuffer } from 'file-type';

// Blocked MIME types — executable and dangerous file types
const BLOCKED_MIMES = new Set([
  'application/x-msdownload',    // .exe
  'application/x-msdos-program', // .com
  'application/x-sh',            // .sh
  'application/x-bat',           // .bat
  'application/x-msi',           // .msi
  'application/x-dosexec',
]);

// Blocked extensions as a fallback
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.vbs', '.js', '.ws', '.wsf',
]);

/**
 * MIME type validation middleware.
 * Reads magic bytes from uploaded files to determine actual type.
 * Rejects files with dangerous MIME types regardless of extension.
 */
export async function mimeValidator(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      next();
      return;
    }

    for (const file of files) {
      // Check extension blocklist
      const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
      if (BLOCKED_EXTENSIONS.has(ext)) {
        res.status(400).json({
          success: false,
          error: `File type "${ext}" is not allowed: ${file.originalname}`,
        });
        return;
      }

      // Read magic bytes to determine actual MIME type
      const detected = await fileTypeFromBuffer(file.buffer);
      if (detected && BLOCKED_MIMES.has(detected.mime)) {
        res.status(400).json({
          success: false,
          error: `File type "${detected.mime}" is not allowed: ${file.originalname}`,
        });
        return;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
