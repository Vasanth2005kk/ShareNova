export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const EXPIRY_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
] as const;

export const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_FILES = 20;
export const MAX_TEXT_SIZE = 500000; // 500KB

export const SUPPORTED_LANGUAGES = [
  'plaintext', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
  'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html',
  'css', 'json', 'yaml', 'xml', 'sql', 'bash', 'markdown', 'dockerfile',
] as const;
