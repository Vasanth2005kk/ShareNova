'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Loader2 } from 'lucide-react';
import DropZone from '@/components/upload/DropZone';
import ProgressBar from '@/components/upload/ProgressBar';
import ShareOptionsForm from '@/components/forms/ShareOptionsForm';
import UIDDisplay from '@/components/share/UIDDisplay';
import { createFileShare } from '@/lib/api';
import type { ShareOptions } from '@/types';

type UploadState = 'idle' | 'uploading' | 'done';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<ShareOptions>({ expiresIn: '24h' });
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [uid, setUid] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (files.length === 0) return;
    setState('uploading');
    setError('');
    setProgress(10);

    try {
      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 400);

      const res = await createFileShare(files, {
        expiresIn: options.expiresIn,
        password: options.password,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (res.success && res.data) {
        setUid(res.data.uid);
        // Calculate expiry for display
        const expiryMs: Record<string, number> = {
          '1h': 3600000, '6h': 21600000, '24h': 86400000,
          '7d': 604800000, '30d': 2592000000,
        };
        if (options.expiresIn && expiryMs[options.expiresIn]) {
          setExpiresAt(new Date(Date.now() + expiryMs[options.expiresIn]).toISOString());
        }
        setState('done');
      } else {
        setError(res.error || 'Upload failed');
        setState('idle');
        setProgress(0);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      setState('idle');
      setProgress(0);
    }
  }

  function reset() {
    setFiles([]);
    setOptions({ expiresIn: '24h' });
    setState('idle');
    setProgress(0);
    setUid('');
    setExpiresAt(null);
    setError('');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {state === 'done' && uid ? (
            <>
              <UIDDisplay uid={uid} expiresAt={expiresAt} />
              <button
                onClick={reset}
                className="w-full py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white transition-all text-sm font-medium"
              >
                Share more files
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Upload Files</h1>
                <p className="text-white/50">
                  Drop your files and get a secure share code.
                </p>
              </div>

              <DropZone files={files} onFilesChange={setFiles} />

              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                    <h3 className="text-sm font-medium text-white/70">Share Options</h3>
                    <ShareOptionsForm options={options} onChange={setOptions} />
                  </div>

                  {state === 'uploading' && (
                    <ProgressBar progress={progress} label="Uploading..." />
                  )}

                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={state === 'uploading'}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium disabled:opacity-50 hover:shadow-xl hover:shadow-violet-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {state === 'uploading' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <UploadIcon className="w-5 h-5" />
                    )}
                    {state === 'uploading' ? 'Uploading...' : 'Upload & Get Code'}
                  </button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
