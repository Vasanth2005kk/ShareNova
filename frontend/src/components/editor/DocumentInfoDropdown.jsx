import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, FileText, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import ShareOptionsForm from '@/components/forms/ShareOptionsForm';
import CountdownTimer from '@/components/common/CountdownTimer';
import '@/styles/DocumentInfoDropdown.css';

export default function DocumentInfoDropdown({ 
  isOpen, 
  onClose, 
  title, 
  setTitle, 
  options, 
  setOptions, 
  contentLength, 
  onClear,
  expiresAt,
  sessionStart
}) {
  // Local draft state to prevent instant updates to the main editor
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftOptions, setDraftOptions] = useState(options);

  // Sync local state when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setDraftTitle(title);
      setDraftOptions(options);
    }
  }, [isOpen, title, options]);

  const handleDone = () => {
    setTitle(draftTitle);
    setOptions(draftOptions);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="dropdown-container"
        >
          <div className="dropdown-card">
            <div className="dropdown-header">
              <div className="header-title">
                <div className="header-icon-wrapper">
                  <Info size={16} />
                </div>
                <span className="header-label">Information</span>
              </div>
              <button 
                onClick={onClose}
                className="close-button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="dropdown-body">
              {/* Document Title Edit */}
              <div>
                <label className="section-label">Document Title</label>
                <div className="title-input-wrapper">
                  <FileText className="title-input-icon" />
                  <input 
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Untitled Document..."
                    className="title-input"
                  />
                </div>
              </div>
              {/* Share Options */}
              <div className="config-section">
                {/* <label className="section-label">Share Configuration</label> */}
                <ShareOptionsForm 
                  options={draftOptions} 
                  onChange={setDraftOptions} 
                  showExpiry={false}
                />
              </div>

              {/* Countdown / Expiry */}
              <div className="remaining-time-box">
                <div className="remaining-time-header">
                  <div className="remaining-time-label">Time Remaining</div>
                  {!expiresAt && (
                    <span className="preview-tag">Preview — resets on save</span>
                  )}
                </div>
                <CountdownTimer expiresAt={expiresAt} expiresIn={draftOptions.expiresIn} sessionStart={sessionStart} />
              </div>

              {/* Actions */}
              <div className="dropdown-actions">
                <button 
                  onClick={() => {
                    if(confirm('Are you sure you want to clear this document?')) {
                      onClear();
                      onClose();
                    }
                  }}
                  className="action-button clear-button"
                >
                  <Trash2 size={14} />
                  Clear Sheet
                </button>
                <button 
                  onClick={handleDone}
                  className="action-button done-button"
                >
                  Done Editing
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
