export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const EXPIRY_OPTIONS = [
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
export const MAX_FILES = 5;
export const MAX_TEXT_SIZE = 500000;
