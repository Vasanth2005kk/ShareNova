import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Loader2 } from 'lucide-react';
import DropZone from '@/components/upload/DropZone';
import ProgressBar from '@/components/upload/ProgressBar';
import ShareOptionsForm from '@/components/forms/ShareOptionsForm';
import UIDDisplay from '@/components/share/UIDDisplay';
import { createFileShare } from '@/lib/api';

const FILE_TYPES = ['All', 'Images', 'Documents', 'Archives', 'Video', 'Audio'];

export default function UploadPage() {
  const location = useLocation();
  const initialState = location.state || {};

  const [files, setFiles] = useState([]);
  const [options, setOptions] = useState({
    expiresIn: initialState.expiresIn || '24h',
    password: initialState.password || ''
  });
  const [state, setState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [uid, setUid] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [maxSize, setMaxSize] = useState(50);

  async function handleUpload() {
    if (files.length === 0) return;
    setState('uploading');
    setError('');
    setProgress(10);

    try {
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
        const expiryMs = {
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
    <div className="page-split">
      {/* ── Left 80% ── */}
      <div className="page-split__main">
        {state === 'done' && uid ? (
          <>
            <UIDDisplay uid={uid} expiresAt={expiresAt} />
            <button onClick={reset} className="page-split__btn-secondary">
              Share more files
            </button>
          </>
        ) : (
          <>
            <div className="page-split__heading">
              <h1>Upload Files</h1>
              <p>Drop your files and get a secure share code.</p>
            </div>

            <DropZone files={files} onFilesChange={setFiles} />

            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-split__fields"
              >
                <div className="page-split__options-box">
                  <h3>Share Options</h3>
                  <ShareOptionsForm options={options} onChange={setOptions} />
                </div>

                {state === 'uploading' && <ProgressBar progress={progress} label="Uploading..." />}
                {error && <p className="page-split__error">{error}</p>}

                <button
                  id="upload-submit"
                  onClick={handleUpload}
                  disabled={state === 'uploading'}
                  className="page-split__btn-primary"
                >
                  {state === 'uploading'
                    ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    : <UploadIcon size={18} />}
                  {state === 'uploading' ? 'Uploading...' : 'Upload & Get Code'}
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>

      <aside className="page-split__sidebar">
        <div className="page-split__sidebar-card">
          <span className="page-split__sidebar-label">Search Files</span>
          <input
            id="upload-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="page-split__search"
          />
        </div>
      </aside>
    </div>
  );
}
