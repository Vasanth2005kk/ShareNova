import { API_URL } from './constants';
import type {
  ApiResponse,
  ShareMetadata,
  CreateShareResponse,
  VerifyResponse,
  TextContent,
} from '@/types';

/**
 * Typed API client — all requests go through here.
 */

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  const data = await res.json();
  return data as ApiResponse<T>;
}

// ─── File Share ─────────────────────────────────────────

export async function createFileShare(
  files: File[],
  options: { expiresIn?: string; password?: string }
): Promise<ApiResponse<CreateShareResponse>> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (options.expiresIn) formData.append('expiresIn', options.expiresIn);
  if (options.password) formData.append('password', options.password);

  return request<CreateShareResponse>('/api/shares/file', {
    method: 'POST',
    body: formData,
  });
}

// ─── Text Share ─────────────────────────────────────────

export async function createTextShare(data: {
  title?: string;
  content: string;
  language?: string;
  expiresIn?: string;
  password?: string;
}): Promise<ApiResponse<CreateShareResponse>> {
  return request<CreateShareResponse>('/api/shares/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ─── Retrieval ──────────────────────────────────────────

export async function getShareByUID(
  uid: string
): Promise<ApiResponse<ShareMetadata>> {
  return request<ShareMetadata>(`/api/shares/${uid}`);
}

export async function verifyPassword(
  uid: string,
  password: string
): Promise<ApiResponse<VerifyResponse>> {
  return request<VerifyResponse>(`/api/shares/${uid}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

export async function getTextContent(
  uid: string,
  sessionToken?: string
): Promise<ApiResponse<TextContent>> {
  const headers: Record<string, string> = {};
  if (sessionToken) headers['X-Session-Token'] = sessionToken;

  return request<TextContent>(`/api/shares/${uid}/content`, { headers });
}

// ─── Downloads ──────────────────────────────────────────

export function getFileDownloadUrl(fileId: string): string {
  return `${API_URL}/api/files/${fileId}/download`;
}

export function getZipDownloadUrl(uid: string): string {
  return `${API_URL}/api/download/${uid}/all`;
}

// ─── Utility ────────────────────────────────────────────

export function formatBytes(bytes: number | string): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
