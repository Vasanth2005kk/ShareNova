import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, ArrowRight, Plus } from 'lucide-react';
import DropZone from '@/components/upload/DropZone';
import ProgressBar from '@/components/upload/ProgressBar';
import ShareOptionsForm from '@/components/forms/ShareOptionsForm';
import UIDDisplay from '@/components/share/UIDDisplay';
import RetrievePanel from '@/components/share/RetrievePanel';
import { createFileShare, formatBytes } from '@/lib/api';
import { MAX_TEXT_SIZE, MAX_FILES, MAX_UPLOAD_SIZE } from '@/lib/constants';

const DEFAULT_OPTIONS = { expiresIn: '24h' };
const EXPIRY_MS = {
  '1h': 3600000,
  '6h': 21600000,
  '24h': 86400000,
  '7d': 604800000,
  '30d': 2592000000,
};

export default function StartPage() {
  const [files, setFiles] = useState([]);
  const [noteName, setNoteName] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteError, setNoteError] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [uid, setUid] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState('');

  const isBusy = status === 'uploading';
  const hasInput = files.length > 0;

  function applyExpiry(expiresIn) {
    if (expiresIn && EXPIRY_MS[expiresIn]) {
      setExpiresAt(new Date(Date.now() + EXPIRY_MS[expiresIn]).toISOString());
    }
  }

  function buildTextFileName(rawName) {
    const trimmed = rawName.trim();
    const baseName = trimmed || `note-${Date.now()}`;
    if (baseName.includes('.')) {
      return baseName;
    }
    return `${baseName}.txt`;
  }

  function addTextFile() {
    if (!noteContent.trim()) {
      setNoteError('Add some text to create a file.');
      return;
    }

    if (files.length >= MAX_FILES) {
      setNoteError(`You can upload up to ${MAX_FILES} files.`);
      return;
    }

    const fileName = buildTextFileName(noteName);
    const textFile = new File([noteContent], fileName, { type: 'text/plain' });
    const totalSize = files.reduce((sum, file) => sum + file.size, 0) + textFile.size;

    if (totalSize > MAX_UPLOAD_SIZE) {
      setNoteError(`Total file size exceeds ${formatBytes(MAX_UPLOAD_SIZE)} limit.`);
      return;
    }

    setFiles((prev) => [...prev, textFile]);
    setNoteName('');
    setNoteContent('');
    setNoteError('');
  }

  async function handleShare() {
    if (!hasInput || isBusy) return;
    setError('');

    let progressInterval;
    setStatus('uploading');
    setProgress(10);

    try {
      progressInterval = setInterval(() => {
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
        applyExpiry(options.expiresIn);
        setStatus('done');
      } else {
        setError(res.error || 'Upload failed');
        setStatus('idle');
        setProgress(0);
      }
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      setError('Upload failed. Please try again.');
      setStatus('idle');
      setProgress(0);
    }
  }

  function resetShare() {
    setOptions(DEFAULT_OPTIONS);
    setStatus('idle');
    setProgress(0);
    setUid('');
    setExpiresAt(null);
    setError('');
    setFiles([]);
    setNoteName('');
    setNoteContent('');
    setNoteError('');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-(--border-soft) bg-(--surface-1) p-6 md:p-8"
        >
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-(--text-primary)">
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 text-orange-400/70 blur-2xl"
                  >
                    Upload
                  </span>
                  <span className="relative">Upload</span>
                </span>
              </h1>
              <p className="mt-2 text-sm text-(--text-muted)">
                Upload files and add a text file in the same share. You will get a simple code to send.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {status === 'done' && uid ? (
              <>
                <UIDDisplay uid={uid} expiresAt={expiresAt} />
                <button
                  onClick={resetShare}
                  className="w-full rounded-2xl border border-(--border-soft) bg-(--surface-2) py-3 text-sm font-medium text-(--text-muted) transition-all hover:bg-(--surface-4) hover:text-(--text-primary)"
                >
                  Share another
                </button>
              </>
            ) : (
              <>
                <DropZone files={files} onFilesChange={setFiles} />

                <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-1) p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-(--text-secondary)">Text file (optional)</h3>
                      <p className="mt-1 text-xs text-(--text-dim)">
                        Create a simple text file and add it to your upload.
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--surface-3)">
                      <FileText className="h-4 w-4 text-orange-400" />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={noteName}
                    onChange={(e) => {
                      setNoteName(e.target.value);
                      if (noteError) setNoteError('');
                    }}
                    placeholder="File name (optional)"
                    className="w-full rounded-xl border border-(--border-subtle) bg-(--surface-2) px-4 py-3 text-(--text-primary) placeholder:text-(--text-placeholder) focus:outline-none focus:border-orange-500/30 transition-all"
                  />
                  <textarea
                    value={noteContent}
                    onChange={(e) => {
                      setNoteContent(e.target.value.slice(0, MAX_TEXT_SIZE));
                      if (noteError) setNoteError('');
                    }}
                    placeholder="Write your text here..."
                    rows={8}
                    className="w-full rounded-xl border border-(--border-subtle) bg-(--surface-1) px-5 py-4 text-sm text-(--text-secondary) placeholder:text-(--text-placeholder) focus:outline-none focus:border-orange-500/30 transition-all resize-none leading-relaxed"
                  />
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={addTextFile}
                      disabled={!noteContent.trim()}
                      className="inline-flex items-center gap-2 rounded-xl border border-(--border-soft) bg-(--surface-2) px-4 py-2 text-xs font-semibold text-(--text-secondary) transition-all hover:border-(--border-strong) hover:text-(--text-primary) disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add text file
                    </button>
                  </div>
                  {noteError && <p className="text-xs text-red-400">{noteError}</p>}
                  {!noteError && noteContent.trim() && (
                    <p className="text-xs text-(--text-dim)">
                      Click "Add text file" to include it in the upload.
                    </p>
                  )}
                </div>

                {hasInput && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-1) p-5">
                      <h3 className="text-sm font-medium text-(--text-secondary)">Share options</h3>
                      <div className="mt-4">
                        <ShareOptionsForm options={options} onChange={setOptions} />
                      </div>
                    </div>

                    {status === 'uploading' && (
                      <ProgressBar progress={progress} label="Uploading..." />
                    )}

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <button
                      onClick={handleShare}
                      disabled={isBusy}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-sm font-semibold text-white transition-all hover:shadow-xl hover:shadow-orange-500/25 disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                      Upload & Get Code
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-(--border-soft) bg-(--surface-1) p-6 md:p-8"
        >
          <RetrievePanel title="Receive" />
        </motion.section>
      </div>
    </div>
  );
}
