import { prisma } from '../db/prisma';
import { ShareType } from '@prisma/client';
import { generateUID } from './UIDService';
import { hashPassword } from './PasswordService';
import * as StorageService from './StorageService';

// ─── Types ──────────────────────────────────────────────

export interface CreateFileShareInput {
  files: Array<{
    filename: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
  }>;
  expiresIn?: string; // '1h', '6h', '24h', '7d', '30d'
  password?: string;
}

export interface CreateTextShareInput {
  title?: string;
  content: string;
  language?: string;
  expiresIn?: string;
  password?: string;
}

export interface ShareMetadata {
  uid: string;
  type: ShareType;
  isPrivate: boolean;
  expiresAt: string | null;
  createdAt: string;
  totalSize: string;
  fileCount?: number;
  files?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: string;
  }>;
  textShare?: {
    title: string | null;
    language: string;
    // content is NOT included in metadata — requires auth for private shares
  } | null;
}

// ─── Helpers ────────────────────────────────────────────

const EXPIRY_MAP: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

function calculateExpiry(expiresIn?: string): Date | null {
  if (!expiresIn || !EXPIRY_MAP[expiresIn]) return null;
  return new Date(Date.now() + EXPIRY_MAP[expiresIn]);
}

// ─── Service ────────────────────────────────────────────

/**
 * Create a file share: upload files to R2, create DB records, return UID.
 */
export async function createFileShare(input: CreateFileShareInput): Promise<string> {
  const uid = await generateUID();
  const expiresAt = calculateExpiry(input.expiresIn);
  const isPrivate = !!input.password;
  const passwordHash = input.password ? await hashPassword(input.password) : null;
  const totalSize = input.files.reduce((sum, f) => sum + f.size, 0);

  // Upload all files to R2
  const fileRecords = await Promise.all(
    input.files.map(async (file) => {
      const storageKey = StorageService.generateStorageKey(uid, file.filename);
      await StorageService.uploadFile(storageKey, file.buffer, file.mimeType);
      return {
        filename: file.filename,
        storageKey,
        mimeType: file.mimeType,
        size: BigInt(file.size),
      };
    })
  );

  // Create share + file records in a transaction
  await prisma.share.create({
    data: {
      uid,
      type: ShareType.FILE,
      isPrivate,
      passwordHash,
      expiresAt,
      totalSize: BigInt(totalSize),
      files: {
        create: fileRecords,
      },
    },
  });

  return uid;
}

/**
 * Create a text share: store text content in DB, return UID.
 */
export async function createTextShare(input: CreateTextShareInput): Promise<string> {
  const uid = await generateUID();
  const expiresAt = calculateExpiry(input.expiresIn);
  const isPrivate = !!input.password;
  const passwordHash = input.password ? await hashPassword(input.password) : null;
  const contentSize = Buffer.byteLength(input.content, 'utf-8');

  await prisma.share.create({
    data: {
      uid,
      type: ShareType.TEXT,
      isPrivate,
      passwordHash,
      expiresAt,
      totalSize: BigInt(contentSize),
      textShare: {
        create: {
          title: input.title || null,
          content: input.content,
          language: input.language || 'plaintext',
        },
      },
    },
  });

  return uid;
}

/**
 * Get share metadata by UID. Does NOT include text content.
 */
export async function getShareByUID(uid: string): Promise<ShareMetadata | null> {
  const share = await prisma.share.findUnique({
    where: { uid },
    include: {
      files: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
        },
      },
      textShare: {
        select: {
          title: true,
          language: true,
        },
      },
    },
  });

  if (!share) return null;

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    return null;
  }

  return {
    uid: share.uid,
    type: share.type,
    isPrivate: share.isPrivate,
    expiresAt: share.expiresAt?.toISOString() || null,
    createdAt: share.createdAt.toISOString(),
    totalSize: share.totalSize.toString(),
    fileCount: share.files.length,
    files: share.files.map((f) => ({
      id: f.id,
      filename: f.filename,
      mimeType: f.mimeType,
      size: f.size.toString(),
    })),
    textShare: share.textShare,
  };
}

/**
 * Get text content for a share (used after auth verification for private shares).
 */
export async function getTextContent(uid: string): Promise<{ title: string | null; content: string; language: string } | null> {
  const share = await prisma.share.findUnique({
    where: { uid },
    include: { textShare: true },
  });

  if (!share || !share.textShare) return null;
  if (share.expiresAt && share.expiresAt < new Date()) return null;

  return {
    title: share.textShare.title,
    content: share.textShare.content,
    language: share.textShare.language,
  };
}

/**
 * Get the password hash for a share (used in verification flow).
 */
export async function getSharePasswordHash(uid: string): Promise<string | null> {
  const share = await prisma.share.findUnique({
    where: { uid },
    select: { passwordHash: true },
  });
  return share?.passwordHash || null;
}

/**
 * Get file details for download (including internal storageKey).
 */
export async function getFileForDownload(fileId: string): Promise<{ storageKey: string; filename: string; shareUid: string; isPrivate: boolean } | null> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      share: {
        select: { uid: true, isPrivate: true, expiresAt: true },
      },
    },
  });

  if (!file) return null;
  if (file.share.expiresAt && file.share.expiresAt < new Date()) return null;

  return {
    storageKey: file.storageKey,
    filename: file.filename,
    shareUid: file.share.uid,
    isPrivate: file.share.isPrivate,
  };
}

/**
 * Get all files for a share (used for ZIP download).
 */
export async function getShareFiles(uid: string): Promise<Array<{ storageKey: string; filename: string }> | null> {
  const share = await prisma.share.findUnique({
    where: { uid },
    include: { files: { select: { storageKey: true, filename: true } } },
  });

  if (!share) return null;
  if (share.expiresAt && share.expiresAt < new Date()) return null;

  return share.files;
}
