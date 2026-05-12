import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, FileText } from 'lucide-react';
import CountdownTimer from '@/components/common/CountdownTimer';

export default function TextShareView({ share, content }) {
  const [copied, setCopied] = useState(false);

  async function copyContent() {
    await navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-(--text-primary) flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            {content.title || 'Shared Text'}
          </h2>
          {content.language && content.language !== 'plaintext' && (
            <p className="text-sm text-(--text-muted) mt-1">{content.language}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {share.expiresAt && <CountdownTimer expiresAt={share.expiresAt} />}
          <button
            onClick={copyContent}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--surface-3) border border-(--border-soft) text-sm text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-4) transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-(--surface-1) border border-(--border-subtle) overflow-hidden">
        <pre className="p-6 text-sm text-(--text-secondary) font-mono whitespace-pre-wrap break-words overflow-auto max-h-[60vh] leading-relaxed">
          {content.content}
        </pre>
      </div>
    </motion.div>
  );
}
