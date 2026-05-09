import crypto from 'crypto';
import { prisma } from '../db/prisma';

const MAX_ATTEMPTS = 10;

/**
 * Generate a cryptographically random 12-digit numeric UID.
 * Uses 6 random bytes (48 bits of entropy) converted to a decimal string.
 * Retries on collision (index-backed uniqueness check).
 */
export async function generateUID(): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const bytes = crypto.randomBytes(6); // 48 bits of entropy
    const num = BigInt('0x' + bytes.toString('hex'));
    const uid = num.toString().slice(0, 12).padStart(12, '0');

    const existing = await prisma.share.findUnique({ where: { uid } });
    if (!existing) return uid;
  }
  throw new Error('UID generation failed after max retries — possible entropy exhaustion');
}

/**
 * Format a 12-digit UID into human-readable groups: "1234 5678 9012"
 */
export function formatUID(uid: string): string {
  return `${uid.slice(0, 4)} ${uid.slice(4, 8)} ${uid.slice(8, 12)}`;
}

/**
 * Strip formatting from a UID input: remove spaces, dashes, etc.
 */
export function normalizeUID(input: string): string {
  return input.replace(/[\s\-]/g, '');
}

/**
 * Validate that a string is a valid 12-digit numeric UID
 */
export function isValidUID(uid: string): boolean {
  return /^\d{12}$/.test(uid);
}
