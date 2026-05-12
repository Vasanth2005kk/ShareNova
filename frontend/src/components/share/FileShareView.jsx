import { motion } from 'framer-motion';
import { FileIcon, Download, Archive } from 'lucide-react';
import { getFileDownloadUrl, getZipDownloadUrl, formatBytes } from '@/lib/api';
import CountdownTimer from '@/components/common/CountdownTimer';
import '@/styles/Share.css';

export default function FileShareView({ share, sessionToken }) {
  const downloadUrl = (fileId) => {
    const url = getFileDownloadUrl(fileId);
    return sessionToken ? `${url}?token=${sessionToken}` : url;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="share-view-container"
    >
      <div className="share-header">
        <div>
          <h2 className="share-title">Shared Files</h2>
          <p className="share-subtitle">
            {share.fileCount} file{(share.fileCount || 0) > 1 ? 's' : ''} · {formatBytes(share.totalSize)}
          </p>
        </div>
        {share.expiresAt && <CountdownTimer expiresAt={share.expiresAt} />}
      </div>

      <div className="file-list">
        {share.files?.map((file, i) => (
          <motion.a
            key={file.id}
            href={downloadUrl(file.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="file-download-item"
          >
            <div className="file-icon-wrapper">
              <FileIcon size={20} color="#fb923c" />
            </div>
            <div className="file-info">
              <p className="file-title">{file.filename}</p>
              <p className="file-meta">{formatBytes(file.size)} · {file.mimeType}</p>
            </div>
            <Download size={16} color="var(--text-dim)" className="download-icon" />
          </motion.a>
        ))}
      </div>

      {(share.fileCount || 0) > 1 && (
        <a
          href={getZipDownloadUrl(share.uid)}
          className="download-all-button"
        >
          <Archive size={16} />
          Download all as ZIP
        </a>
      )}
    </motion.div>
  );
}
