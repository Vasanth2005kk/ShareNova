'use client';

import { motion } from 'framer-motion';
import { FileIcon, Download, Archive } from 'lucide-react';
import { getFileDownloadUrl, getZipDownloadUrl, formatBytes } from '@/lib/api';
import CountdownTimer from '@/components/common/CountdownTimer';
import type { ShareMetadata } from '@/types';

interface FileShareViewProps {
  share: ShareMetadata;
  sessionToken?: string;
}

export default function FileShareView({ share, sessionToken }: FileShareViewProps) {
  const downloadUrl = (fileId: string) => {
    const url = getFileDownloadUrl(fileId);
    return sessionToken ? `${url}?token=${sessionToken}` : url;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Shared Files</h2>
          <p className="text-sm text-white/50 mt-1">
            {share.fileCount} file{(share.fileCount || 0) > 1 ? 's' : ''} · {formatBytes(share.totalSize)}
          </p>
        </div>
        {share.expiresAt && <CountdownTimer expiresAt={share.expiresAt} />}
      </div>

      <div className="space-y-2">
        {share.files?.map((file, i) => (
          <motion.a
            key={file.id}
            href={downloadUrl(file.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center shrink-0">
              <FileIcon className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{file.filename}</p>
              <p className="text-xs text-white/40">{formatBytes(file.size)} · {file.mimeType}</p>
            </div>
            <Download className="w-4 h-4 text-white/30 group-hover:text-violet-400 transition-colors shrink-0" />
          </motion.a>
        ))}
      </div>

      {(share.fileCount || 0) > 1 && (
        <a
          href={getZipDownloadUrl(share.uid)}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:text-white transition-all text-sm font-medium"
        >
          <Archive className="w-4 h-4" />
          Download all as ZIP
        </a>
      )}
    </motion.div>
  );
}
