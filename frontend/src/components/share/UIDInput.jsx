import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { formatUID, normalizeUID, isValidUID } from '@/lib/uid';
import '@/styles/Share.css';

export default function UIDInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleChange = useCallback((e) => {
    const raw = normalizeUID(e.target.value);
    setValue(raw);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
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
    <form onSubmit={handleSubmit} className="uid-input-form">
      <motion.div
        animate={{
          borderColor: isFocused ? 'var(--accent-ring)' : 'var(--border-subtle)',
          boxShadow: isFocused ? '0 0 30px var(--accent-ring-glow)' : '0 0 0px transparent',
        }}
        className="uid-input-container"
      >
        <div className="uid-input-icon">
          <Search size={20} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="000 000"
          maxLength={7}
          className="uid-input-field"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="uid-submit-button"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowRight size={20} />
          )}
        </button>
      </motion.div>
      <p className="uid-helper-text">
        Enter the 6-digit share code to retrieve files or text
      </p>
    </form>
  );
}
