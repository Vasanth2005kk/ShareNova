import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import '@/styles/PasswordGate.css';

export default function PasswordGate({ onVerify, isLoading }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const ok = await onVerify(password);
    if (!ok) setError('Incorrect password. Please try again.');
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="password-gate-container"
    >
      <div className="password-gate-icon-wrapper">
        <ShieldCheck size={28} color="#fbbf24" />
      </div>
      <h2 className="password-gate-title">Password Protected</h2>
      <p className="password-gate-desc">This share requires a password to access.</p>
      <form onSubmit={handleSubmit} className="password-gate-form">
        <div className="password-gate-input-wrapper">
          <Lock className="password-gate-input-icon" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="password-gate-input"
            autoFocus
          />
        </div>
        {error && <p className="password-gate-error">{error}</p>}
        <button
          type="submit"
          disabled={!password || isLoading}
          className="password-gate-submit"
        >
          {isLoading ? 'Verifying...' : 'Unlock'}
        </button>
      </form>
    </motion.div>
  );
}
