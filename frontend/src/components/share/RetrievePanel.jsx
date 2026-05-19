import { useState } from 'react';
import { motion } from 'framer-motion';
import UIDInput from '@/components/share/UIDInput';
import PasswordGate from '@/components/forms/PasswordGate';
import TextShareView from '@/components/share/TextShareView';
import FileShareView from '@/components/share/FileShareView';
import { getShareByUID, verifyPassword, getTextContent } from '@/lib/api';

export default function RetrievePanel({ title = 'Retrieve a Share', description = 'Enter the 6-digit code to access shared content.' }) {
  const [share, setShare] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [sessionToken, setSessionToken] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleUIDSubmit(uid) {
    setIsLoading(true);
    setError('');
    setShare(null);
    setTextContent(null);
    setNeedsPassword(false);

    try {
      const res = await getShareByUID(uid);
      if (!res.success || !res.data) {
        setError(res.error || 'Share not found');
        setIsLoading(false);
        return;
      }

      const shareData = res.data;
      setShare(shareData);

      if (shareData.isPrivate) {
        setNeedsPassword(true);
        setIsLoading(false);
        return;
      }

      if (shareData.type === 'TEXT') {
        const contentRes = await getTextContent(shareData.uid);
        if (contentRes.success && contentRes.data) {
          setTextContent(contentRes.data);
        }
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to retrieve share');
      setIsLoading(false);
    }
  }

  async function handlePasswordVerify(password) {
    if (!share) return false;
    const res = await verifyPassword(share.uid, password);
    if (res.success && res.data) {
      const token = res.data.sessionToken;
      setSessionToken(token);
      setNeedsPassword(false);

      if (share.type === 'TEXT') {
        const contentRes = await getTextContent(share.uid, token);
        if (contentRes.success && contentRes.data) {
          setTextContent(contentRes.data);
        }
      }
      return true;
    }
    return false;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-(--text-primary)">
          <span className="relative inline-block">
            <span
              aria-hidden="true"
              className="absolute inset-0 text-orange-400/70 blur-2xl"
            >
              {title}
            </span>
            <span className="relative">{title}</span>
          </span>
        </h2>
        <p className="mt-2 text-sm text-(--text-muted)">{description}</p>
      </div>

      <UIDInput onSubmit={handleUIDSubmit} isLoading={isLoading} />

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 text-center">
          {error}
        </motion.p>
      )}

      {needsPassword && share && <PasswordGate onVerify={handlePasswordVerify} />}

      {share && !needsPassword && share.type === 'TEXT' && textContent && (
        <TextShareView share={share} content={textContent} />
      )}

      {share && !needsPassword && share.type === 'FILE' && (
        <FileShareView share={share} sessionToken={sessionToken} />
      )}
    </div>
  );
}
