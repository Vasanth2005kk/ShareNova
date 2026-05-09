'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileIcon, X } from 'lucide-react';
import { MAX_UPLOAD_SIZE, MAX_FILES } from '@/lib/constants';
import { formatBytes } from '@/lib/api';

interface DropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function DropZone({ files, onFilesChange }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [files]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files));
      }
    },
    [files]
  );

  function addFiles(newFiles: File[]) {
    const combined = [...files, ...newFiles].slice(0, MAX_FILES);
    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_UPLOAD_SIZE) {
      alert(`Total file size exceeds ${formatBytes(MAX_UPLOAD_SIZE)} limit`);
      return;
    }
    onFilesChange(combined);
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.06)',
          backgroundColor: isDragging ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
        }}
        className="relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <motion.div
          animate={{ y: isDragging ? -4 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
            <Upload className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-1">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-white/40 text-sm">
            or click to browse · up to {MAX_FILES} files · {formatBytes(MAX_UPLOAD_SIZE)} max
          </p>
        </motion.div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm text-white/50 px-1">
              <span>{files.length} file{files.length > 1 ? 's' : ''}</span>
              <span>{formatBytes(totalSize)}</span>
            </div>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center shrink-0">
                  <FileIcon className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{file.name}</p>
                  <p className="text-xs text-white/40">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
