'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import UIDInput from '@/components/share/UIDInput';
import PasswordGate from '@/components/forms/PasswordGate';
import FileShareView from '@/components/share/FileShareView';
import TextShareView from '@/components/share/TextShareView';
import { getShareByUID, verifyPassword, getTextContent } from '@/lib/api';
import type { ShareMetadata, TextContent } from '@/types';

type PageState = 'input' | 'loading' | 'password' | 'viewing';

export default function RetrievePage() {
  const [state, setState] = useState<PageState>('input');
  const [share, setShare] = useState<ShareMetadata | null>(null);
  const [textContent, setTextContent] = useState<TextContent | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleUIDSubmit(uid: string) {
    setState('loading');
    setError('');

    try {
      const res = await getShareByUID(uid);

      if (!res.success || !res.data) {
        setError(res.error || 'Share not found or has expired');
        setState('input');
        return;
      }

      setShare(res.data);

      if (res.data.isPrivate) {
        setState('password');
        return;
      }

      // If text share, fetch content directly
      if (res.data.type === 'TEXT') {
        const contentRes = await getTextContent(uid);
        if (contentRes.success && contentRes.data) {
          setTextContent(contentRes.data);
        }
      }

      setState('viewing');
    } catch {
      setError('Something went wrong. Please try again.');
      setState('input');
    }
  }

  async function handlePasswordVerify(password: string): Promise<boolean> {
    if (!share) return false;
    setIsVerifying(true);

    try {
      const res = await verifyPassword(share.uid, password);

      if (!res.success || !res.data) {
        setIsVerifying(false);
        return false;
      }

      const token = res.data.sessionToken;
      setSessionToken(token);

      // If text share, fetch content with the session token
      if (share.type === 'TEXT') {
        const contentRes = await getTextContent(share.uid, token);
        if (contentRes.success && contentRes.data) {
          setTextContent(contentRes.data);
        }
      }

      setState('viewing');
      setIsVerifying(false);
      return true;
    } catch {
      setIsVerifying(false);
      return false;
    }
  }

  function reset() {
    setState('input');
    setShare(null);
    setTextContent(null);
    setSessionToken(undefined);
    setError('');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {state === 'input' || state === 'loading' ? (
            <>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                  <Search className="w-7 h-7 text-violet-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Retrieve a Share</h1>
                <p className="text-white/50">
                  Enter the 12-digit code to access shared files or text.
                </p>
              </div>

              <UIDInput
                onSubmit={handleUIDSubmit}
                isLoading={state === 'loading'}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400 text-center"
                >
                  {error}
                </motion.p>
              )}
            </>
          ) : state === 'password' ? (
            <PasswordGate onVerify={handlePasswordVerify} isLoading={isVerifying} />
          ) : state === 'viewing' && share ? (
            <>
              {share.type === 'FILE' ? (
                <FileShareView share={share} sessionToken={sessionToken} />
              ) : textContent ? (
                <TextShareView share={share} content={textContent} />
              ) : (
                <p className="text-center text-white/50">Unable to load content.</p>
              )}

              <button
                onClick={reset}
                className="w-full py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white transition-all text-sm font-medium"
              >
                Retrieve another share
              </button>
            </>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
