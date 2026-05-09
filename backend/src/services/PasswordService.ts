import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env';

// In-memory session store (replace with Redis in production)
const sessionStore = new Map<string, { uid: string; expiresAt: number }>();

/**
 * Hash a password using bcrypt with configured cost factor.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a session token for authenticated access to a private share.
 * Token expires after 15 minutes.
 */
export function createSessionToken(uid: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  sessionStore.set(token, { uid, expiresAt });
  return token;
}

/**
 * Validate a session token. Returns the associated UID if valid.
 */
export function validateSessionToken(token: string, uid: string): boolean {
  const session = sessionStore.get(token);
  if (!session) return false;

  // Check expiry
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return false;
  }

  // Check that token is for the correct UID
  if (session.uid !== uid) return false;

  return true;
}

/**
 * Cleanup expired sessions (called periodically).
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(token);
    }
  }
}

// Run session cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
