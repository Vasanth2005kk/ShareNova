import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, FileText, Lock, Clock, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '@/styles/EditorConfigModal.css';

export default function EditorConfigModal({ isOpen, onClose, data, onChange }) {
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);

  if (!isOpen) return null;

  const isValid = data.title.trim() !== '';

  const handleProceed = () => {
    if (!isValid) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    navigate(data.fileEnabled ? '/upload' : '/text', { state: data });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="modal-overlay"
      />
      <motion.div
        key="content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal-content"
      >
        <h2 className="modal-title">Create Editor</h2>
        <button type="button" onClick={onClose} className="modal-close">
          <X size={20} />
        </button>
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleProceed();
          }}
        >
          <div className="form-group">
            <label className="form-label">Title</label>
            <div className="input-wrapper">
              <FileText className="input-icon" />
              <input
                type="text"
                value={data.title}
                onChange={(e) => {
                  onChange({ ...data, title: e.target.value });
                  if (e.target.value.trim()) setShowError(false);
                }}
                placeholder="Enter share title..."
                autoComplete="username"
                className={`input-field ${showError && !data.title.trim() ? 'error' : ''}`}
              />
            </div>
            <AnimatePresence>
              {showError && !data.title.trim() && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="error-message"
                >
                  <AlertCircle size={12} />
                  Title is required
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                value={data.password}
                onChange={(e) => onChange({ ...data, password: e.target.value })}
                placeholder="Set a password..."
                autoComplete="current-password"
                className="input-field"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <div className="input-wrapper">
                <Clock className="input-icon" />
                <select
                  value={data.expiresIn}
                  onChange={(e) => onChange({ ...data, expiresIn: e.target.value })}
                  className="select-field"
                >
                  <option value="30m">30 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="6h">6 Hours</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`modal-submit ${isValid ? 'valid' : 'invalid'}`}
          >
            Proceed to Editor
            <ArrowRight size={20} />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
