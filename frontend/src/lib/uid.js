const UID_LENGTH = 6;
const UID_GROUP = 3;

/**
 * Format a 6-digit UID into groups: "123 456"
 */
export function formatUID(uid) {
  const clean = uid.replace(/\D/g, '').slice(0, UID_LENGTH);
  const parts = [];
  for (let i = 0; i < clean.length; i += UID_GROUP) {
    parts.push(clean.slice(i, i + UID_GROUP));
  }
  return parts.join(' ');
}

/**
 * Strip all non-digit characters from a UID input.
 */
export function normalizeUID(input) {
  return input.replace(/\D/g, '').slice(0, UID_LENGTH);
}

/**
 * Check if a string is a valid 6-digit UID.
 */
export function isValidUID(uid) {
  return new RegExp(`^\\d{${UID_LENGTH}}$`).test(uid);
}

/**
 * Generate a random 6-digit UID.
 */
export function generateUID() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return String(buf[0] % 1000000).padStart(UID_LENGTH, '0');
  }
  return String(Math.floor(Math.random() * 1000000)).padStart(UID_LENGTH, '0');
}
