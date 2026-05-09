'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { formatUID, normalizeUID, isValidUID } from '@/lib/uid';

interface UIDInputProps {
  onSubmit: (uid: string) => void;
  isLoading?: boolean;
}

export default function UIDInput({ onSubmit, isLoading }: UIDInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = normalizeUID(e.target.value);
    setValue(raw);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const clean = normalizeUID(value);
      if (isValidUID(clean)) {
        onSubmit(clean);
      }
    },
    [value, onSubmit]
  );

  const displayValue = formatUID(value);
  const isValid = isValidUID(normalizeUID(value));

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <motion.div
        animate={{
          borderColor: isFocused
            ? 'rgba(139, 92, 246, 0.3)'
            : 'rgba(255, 255, 255, 0.06)',
          boxShadow: isFocused
            ? '0 0 30px rgba(139, 92, 246, 0.1)'
            : '0 0 0px transparent',
        }}
        className="relative flex items-center rounded-2xl border bg-white/[0.03] backdrop-blur-xl overflow-hidden"
      >
        <div className="pl-5">
          <Search className="w-5 h-5 text-white/30" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="0000 0000 0000"
          maxLength={14} // 12 digits + 2 spaces
          className="flex-1 bg-transparent px-4 py-5 text-2xl font-mono tracking-[0.2em] text-white placeholder:text-white/20 focus:outline-none text-center"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="mr-3 p-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-105 active:scale-95"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </button>
      </motion.div>
      <p className="text-center text-sm text-white/30 mt-3">
        Enter the 12-digit share code to retrieve files or text
      </p>
    </form>
  );
}
