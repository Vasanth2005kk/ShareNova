'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';
import ShareOptionsForm from '@/components/forms/ShareOptionsForm';
import UIDDisplay from '@/components/share/UIDDisplay';
import { createTextShare } from '@/lib/api';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import type { ShareOptions } from '@/types';

type PageState = 'editing' | 'submitting' | 'done';

export default function TextPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [options, setOptions] = useState<ShareOptions>({ expiresIn: '24h' });
  const [state, setState] = useState<PageState>('editing');
  const [uid, setUid] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!content.trim()) return;
    setState('submitting');
    setError('');

    try {
      const res = await createTextShare({
        title: title || undefined,
        content,
        language,
        expiresIn: options.expiresIn,
        password: options.password,
      });

      if (res.success && res.data) {
        setUid(res.data.uid);
        const expiryMs: Record<string, number> = {
          '1h': 3600000, '6h': 21600000, '24h': 86400000,
          '7d': 604800000, '30d': 2592000000,
        };
        if (options.expiresIn && expiryMs[options.expiresIn]) {
          setExpiresAt(new Date(Date.now() + expiryMs[options.expiresIn]).toISOString());
        }
        setState('done');
      } else {
        setError(res.error || 'Failed to create text share');
        setState('editing');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setState('editing');
    }
  }

  function reset() {
    setTitle('');
    setContent('');
    setLanguage('plaintext');
    setOptions({ expiresIn: '24h' });
    setState('editing');
    setUid('');
    setExpiresAt(null);
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
          {state === 'done' && uid ? (
            <>
              <UIDDisplay uid={uid} expiresAt={expiresAt} />
              <button
                onClick={reset}
                className="w-full py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white transition-all text-sm font-medium"
              >
                Share more text
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Share Text</h1>
                <p className="text-white/50">Paste code, notes, or any text. Get a secure share code.</p>
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 transition-all"
              />

              {/* Language selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-[#1a1a2e]">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text editor */}
              <div className="relative rounded-xl overflow-hidden border border-white/[0.06] focus-within:border-violet-500/30 transition-all">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your text, code, or notes here..."
                  rows={16}
                  maxLength={500000}
                  className="w-full bg-white/[0.02] px-5 py-4 text-sm text-white/80 font-mono leading-relaxed placeholder:text-white/20 focus:outline-none resize-none"
                />
                <div className="absolute bottom-3 right-4 text-xs text-white/20">
                  {content.length.toLocaleString()} / 500,000
                </div>
              </div>

              {/* Options */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                <h3 className="text-sm font-medium text-white/70">Share Options</h3>
                <ShareOptionsForm options={options} onChange={setOptions} />
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!content.trim() || state === 'submitting'}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium disabled:opacity-40 hover:shadow-xl hover:shadow-violet-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {state === 'submitting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                {state === 'submitting' ? 'Creating...' : 'Share & Get Code'}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
