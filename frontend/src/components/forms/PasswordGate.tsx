'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';

interface PasswordGateProps {
  onVerify: (password: string) => Promise<boolean>;
  isLoading?: boolean;
}

export default function PasswordGate({ onVerify, isLoading }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const ok = await onVerify(password);
    if (!ok) setError('Incorrect password. Please try again.');
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center"
    >
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
        <ShieldCheck className="w-7 h-7 text-amber-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Password Protected</h2>
      <p className="text-sm text-white/50 mb-6">This share requires a password to access.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 transition-all"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!password || isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium disabled:opacity-40 hover:shadow-lg hover:shadow-violet-500/25 transition-all"
        >
          {isLoading ? 'Verifying...' : 'Unlock'}
        </button>
      </form>
    </motion.div>
  );
}
