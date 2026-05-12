import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Sparkles } from 'lucide-react';
import { formatUID } from '@/lib/uid';
import CountdownTimer from '@/components/common/CountdownTimer';
import '@/styles/UIDDisplay.css';

export default function UIDDisplay({ uid, expiresAt }) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = uid;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className="uid-display-container"
    >
      <div className="uid-display-bg-gradient" />
      <div className="uid-display-glow" />

      <div className="uid-display-content">
        <div className="success-badge">
          <Sparkles size={12} />
          Share created successfully
        </div>

        <div>
          <p className="uid-label">Your Share Code</p>
          <div className="uid-code-wrapper">
            <span className="uid-code">
              {formatUID(uid)}
            </span>
            <button
              onClick={copyToClipboard}
              className="copy-button"
              title="Copy UID"
            >
              {copied ? (
                <Check size={20} color="#34d399" />
              ) : (
                <Copy size={20} color="var(--text-muted)" />
              )}
            </button>
          </div>
        </div>

        <p className="uid-description">
          Share this code with anyone who needs access. They can retrieve your files at the{' '}
          <span className="highlight-text">Retrieve</span> page.
        </p>

        {expiresAt && (
          <div className="timer-wrapper">
            <CountdownTimer expiresAt={expiresAt} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
