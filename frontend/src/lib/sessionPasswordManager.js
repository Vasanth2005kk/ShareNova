/**
 * Session Password Manager
 * Tracks password-verified shares for the current session
 * Data persists only for the current browser session (cleared on tab close)
 */

const VERIFIED_SHARES_KEY = 'sharenova_verified_shares';

/**
 * Get the verified shares object from sessionStorage
 * @returns {Object} Object with shareUid as key and { token, timestamp } as value
 */
function getVerifiedShares() {
  try {
    const data = sessionStorage.getItem(VERIFIED_SHARES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Save verified shares to sessionStorage
 * @param {Object} verified Object with shareUid as key and { token, timestamp } as value
 */
function saveVerifiedShares(verified) {
  try {
    sessionStorage.setItem(VERIFIED_SHARES_KEY, JSON.stringify(verified));
  } catch (err) {
    console.warn('Failed to save verified shares to sessionStorage:', err);
  }
}

/**
 * Mark a share as password-verified in the current session
 * @param {string} shareUid The share UID
 * @param {string} sessionToken The session token from the password verification API
 */
export function markShareAsVerified(shareUid, sessionToken) {
  if (!shareUid || !sessionToken) return;
  
  const verified = getVerifiedShares();
  verified[shareUid] = {
    token: sessionToken,
    timestamp: Date.now(),
  };
  saveVerifiedShares(verified);
}

/**
 * Check if a share has been password-verified in the current session
 * @param {string} shareUid The share UID
 * @returns {string|null} The session token if verified, null otherwise
 */
export function getShareSessionToken(shareUid) {
  if (!shareUid) return null;
  
  const verified = getVerifiedShares();
  return verified[shareUid]?.token || null;
}

/**
 * Check if a share requires password verification
 * @param {Object} share The share object from API
 * @param {string} shareUid The share UID (optional, falls back to share.uid)
 * @returns {boolean} True if password is required, false otherwise
 */
export function doesShareRequirePassword(share, shareUid) {
  if (!share || !share.isPrivate) return false;
  
  const uid = shareUid || share.uid;
  const token = getShareSessionToken(uid);
  
  // If we have a token for this share, password is already verified
  return !token;
}

/**
 * Clear password verification for a specific share
 * @param {string} shareUid The share UID
 */
export function clearShareVerification(shareUid) {
  if (!shareUid) return;
  
  const verified = getVerifiedShares();
  delete verified[shareUid];
  saveVerifiedShares(verified);
}

/**
 * Clear all verified shares (useful for logout or security purposes)
 */
export function clearAllVerifications() {
  try {
    sessionStorage.removeItem(VERIFIED_SHARES_KEY);
  } catch (err) {
    console.warn('Failed to clear verified shares:', err);
  }
}

/**
 * Get all currently verified shares
 * @returns {Object} Object with shareUid as key and { token, timestamp } as value
 */
export function getAllVerifiedShares() {
  return getVerifiedShares();
}
