// ─── API Response Envelope ──────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

// ─── Share Types ────────────────────────────────────────
export type ShareType = 'FILE' | 'TEXT';

export interface ShareMetadata {
  uid: string;
  type: ShareType;
  isPrivate: boolean;
  expiresAt: string | null;
  createdAt: string;
  totalSize: string;
  fileCount?: number;
  files?: FileInfo[];
  textShare?: {
    title: string | null;
    language: string;
  } | null;
}

export interface FileInfo {
  id: string;
  filename: string;
  mimeType: string;
  size: string;
}

export interface TextContent {
  title: string | null;
  content: string;
  language: string;
}

export interface CreateShareResponse {
  uid: string;
  formattedUID: string;
}

export interface VerifyResponse {
  sessionToken: string;
}

// ─── Form Types ─────────────────────────────────────────
export type ExpiryOption = '1h' | '6h' | '24h' | '7d' | '30d';

export interface ShareOptions {
  expiresIn?: ExpiryOption;
  password?: string;
}
