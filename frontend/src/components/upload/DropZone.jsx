import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileIcon } from 'lucide-react';
import { formatBytes } from '@/lib/api';
import { MAX_UPLOAD_SIZE, MAX_FILES } from '@/lib/constants';
import '@/styles/DropZone.css';

export default function DropZone({ files, onFilesChange }) {
  const [isDragOver, setIsDragOver] = useState(false);

  function addFiles(newFiles) {
    const fileArray = Array.from(newFiles);
    const combined = [...files, ...fileArray].slice(0, MAX_FILES);

    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_UPLOAD_SIZE) {
      alert(`Total file size exceeds ${formatBytes(MAX_UPLOAD_SIZE)} limit`);
      return;
    }

    onFilesChange(combined);
  }

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [files]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleInputChange = useCallback(
    (e) => {
      if (e.target.files) addFiles(e.target.files);
    },
    [files]
  );

  function removeFile(index) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="dropzone-container">
      <motion.label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        animate={{
          borderColor: isDragOver ? 'var(--accent-ring)' : 'var(--border-subtle)',
          backgroundColor: isDragOver ? 'var(--accent-surface)' : 'var(--surface-1)',
        }}
        className="dropzone-label"
      >
        <div className="dropzone-icon-wrapper">
          <Upload className="dropzone-icon" />
        </div>
        <div className="text-center">
          <p className="dropzone-text-main">
            Drop files here or <span className="dropzone-text-highlight">browse</span>
          </p>
          <p className="dropzone-text-sub">
            Up to {MAX_FILES} files · Max {formatBytes(MAX_UPLOAD_SIZE)} total
          </p>
        </div>
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden-input"
        />
      </motion.label>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, i) => (
            <motion.div
              key={`${file.name}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="file-item"
            >
              <FileIcon className="file-icon" />
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatBytes(file.size)}</span>
              <button
                onClick={() => removeFile(i)}
                className="file-remove"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
