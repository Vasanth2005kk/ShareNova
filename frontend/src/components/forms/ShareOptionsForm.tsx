'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Lock, ChevronDown } from 'lucide-react';
import { EXPIRY_OPTIONS } from '@/lib/constants';
import type { ShareOptions, ExpiryOption } from '@/types';

interface ShareOptionsFormProps {
  options: ShareOptions;
  onChange: (options: ShareOptions) => void;
}

export default function ShareOptionsForm({ options, onChange }: ShareOptionsFormProps) {
  const [showPassword, setShowPassword] = useState(!!options.password);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/60">
          <Clock className="w-4 h-4" />
          Expires after
        </label>
        <div className="relative">
          <select
            value={options.expiresIn || '24h'}
            onChange={(e) => onChange({ ...options, expiresIn: e.target.value as ExpiryOption })}
            className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all cursor-pointer"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a2e]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            setShowPassword(!showPassword);
            if (showPassword) onChange({ ...options, password: undefined });
          }}
          className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white/80 transition-colors w-full"
        >
          <Lock className="w-4 h-4" />
          Password protection
          <div className={`ml-auto w-9 h-5 rounded-full transition-colors duration-200 flex items-center ${showPassword ? 'bg-violet-500' : 'bg-white/10'}`}>
            <motion.div
              animate={{ x: showPassword ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </div>
        </button>
        {showPassword && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <input
              type="password"
              placeholder="Set a password (min. 4 characters)"
              value={options.password || ''}
              onChange={(e) => onChange({ ...options, password: e.target.value })}
              minLength={4}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 transition-all"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
