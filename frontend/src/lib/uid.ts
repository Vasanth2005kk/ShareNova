/**
 * Format a 12-digit UID into groups: "1234 5678 9012"
 */
export function formatUID(uid: string): string {
  const clean = uid.replace(/\D/g, '');
  const parts = [];
  for (let i = 0; i < clean.length && i < 12; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Strip all non-digit characters from a UID input.
 */
export function normalizeUID(input: string): string {
  return input.replace(/\D/g, '').slice(0, 12);
}

/**
 * Check if a string is a valid 12-digit UID.
 */
export function isValidUID(uid: string): boolean {
  return /^\d{12}$/.test(uid);
}
