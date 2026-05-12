import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, FileText } from 'lucide-react';
import CountdownTimer from '@/components/common/CountdownTimer';
import '@/styles/Share.css';

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
      className="share-view-container"
    >
      <div className="share-header">
        <div>
          <h2 className="share-title">
            <FileText size={20} color="#fb923c" />
            {content.title || 'Shared Text'}
          </h2>
          <p className="share-subtitle">{content.language}</p>
        </div>
        <div className="action-bar">
          {share.expiresAt && <CountdownTimer expiresAt={share.expiresAt} />}
          <button
            onClick={copyContent}
            className="secondary-button"
          >
            {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="text-content-box">
        <pre className="text-content">
          {content.content}
        </pre>
      </div>
    </motion.div>
  );
}
