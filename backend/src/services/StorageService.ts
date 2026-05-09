import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

/**
 * StorageService — R2/S3 abstraction layer.
 * All storage URLs are internal; never exposed to clients.
 * Downloads go through presigned URLs with short TTLs.
 */

const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file buffer to R2.
 */
export async function uploadFile(
  storageKey: string,
  body: Buffer,
  mimeType: string
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: storageKey,
      Body: body,
      ContentType: mimeType,
    })
  );
}

/**
 * Generate a presigned download URL with a 60-second TTL.
 * This URL is consumed by the backend proxy — never sent to the client.
 */
export async function getPresignedDownloadUrl(
  storageKey: string,
  filename: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 60 });
}

/**
 * Get a readable stream for a file (used for ZIP streaming).
 */
export async function getFileStream(storageKey: string) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: storageKey,
    })
  );
  return response.Body;
}

/**
 * Delete a single file from R2.
 */
export async function deleteFile(storageKey: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: storageKey,
    })
  );
}

/**
 * Delete multiple files from R2 in a single request.
 */
export async function deleteFiles(storageKeys: string[]): Promise<void> {
  if (storageKeys.length === 0) return;

  // S3 DeleteObjects supports max 1000 keys per request
  const batches: string[][] = [];
  for (let i = 0; i < storageKeys.length; i += 1000) {
    batches.push(storageKeys.slice(i, i + 1000));
  }

  for (const batch of batches) {
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET_NAME,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
          Quiet: true,
        },
      })
    );
  }
}

/**
 * Generate a storage key for a file within a share.
 * Format: shares/{uid}/{filename}
 */
export function generateStorageKey(uid: string, filename: string): string {
  // Add a random suffix to prevent collisions with same filenames
  const suffix = Math.random().toString(36).substring(2, 8);
  return `shares/${uid}/${suffix}_${filename}`;
}
