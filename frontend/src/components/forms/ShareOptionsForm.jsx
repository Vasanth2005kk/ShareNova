import { Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { EXPIRY_OPTIONS } from '@/lib/constants';
import '@/styles/ShareOptionsForm.css';

export default function ShareOptionsForm({ 
  options, 
  onChange,
  showExpiry = true,
  showPassword = true
}) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="form-container">
      {/* Expiry */}
      {showExpiry && (
        <div>
          <label className="form-label">Expiry</label>
          <div className="chip-container">
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...options, expiresIn: opt.value })}
                className={`chip-button ${options.expiresIn === opt.value ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Password */}
      {showPassword && (
        <div>
          <label className="form-label">Password (optional)</label>
          <div className="input-container">
            <Lock className="input-icon-left" />
            <input
              type={showPw ? 'text' : 'password'}
              value={options.password || ''}
              onChange={(e) => onChange({ ...options, password: e.target.value || undefined })}
              placeholder="Set a password"
              className="form-input"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="input-icon-right"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
