import { API_URL } from './constants';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers },
  });
  return await res.json();
}

// ─── File Share ─────────────────────────────────────────

export async function createFileShare(files, options) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (options.expiresIn) formData.append('expiresIn', options.expiresIn);
  if (options.password) formData.append('password', options.password);

  return request('/api/shares/file', {
    method: 'POST',
    body: formData,
  });
}

// ─── Text Share ─────────────────────────────────────────

export async function createTextShare(data) {
  return request('/api/shares/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateTextShare(uid, data, sessionToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (sessionToken) headers['X-Session-Token'] = sessionToken;
  return request(`/api/shares/text/${uid}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
}

// ─── Retrieval ──────────────────────────────────────────

export async function getShareByUID(uid) {
  return request(`/api/shares/${uid}`);
}

export async function verifyPassword(uid, password) {
  return request(`/api/shares/${uid}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

export async function getTextContent(uid, sessionToken) {
  const headers = {};
  if (sessionToken) headers['X-Session-Token'] = sessionToken;
  return request(`/api/shares/${uid}/content`, { headers });
}

// ─── Downloads ──────────────────────────────────────────

export function getFileDownloadUrl(fileId) {
  return `${API_URL}/api/files/${fileId}/download`;
}

export function getZipDownloadUrl(uid) {
  return `${API_URL}/api/download/${uid}/all`;
}

// ─── Utility ────────────────────────────────────────────

export function formatBytes(bytes) {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
