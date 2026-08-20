import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import '@/styles/PasswordModal.css';

export default function PasswordModal({ isOpen, onClose, roomTitle, onConfirm, allowClose = true }) {
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password.trim() || isSubmitting) {
      if (!password.trim()) {
        setShowError(true);
        setTimeout(() => setShowError(false), 2500);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = () => {
    if (allowClose) {
      onClose();
    }
  };

  const content = (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
        className="modal-overlay"
      />

      <motion.div
        key="content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Enter Room Password</h2>
        <button 
          type="button" 
          onClick={onClose} 
          className="modal-close"
          disabled={!allowClose}
          style={{ opacity: allowClose ? 1 : 0.4, cursor: allowClose ? 'pointer' : 'not-allowed' }}
        >
          <X size={20} />
        </button>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Room</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="text"
                value={roomTitle || ''}
                readOnly
                className="input-field"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value.trim()) setShowError(false);
                }}
                placeholder="Enter room password..."
                className={`input-field ${showError && !password.trim() ? 'error' : ''}`}
              />
            </div>
            {showError && !password.trim() && (
              <p className="error-message">
                <AlertCircle size={12} />
                Password is required
              </p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className={`modal-submit ${password.trim() ? 'valid' : 'invalid'}`}>
            {isSubmitting ? (
              <>
                <span>Verifying...</span>
                <Loader2 size={18} className="animate-spin" />
              </>
            ) : (
              <span>Unlock Room</span>
            )}
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
