import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { FileText, Loader2, Sparkles, Save, Info, Copy, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import UIDDisplay from '@/components/share/UIDDisplay';
import DropZone from '@/components/upload/DropZone';
import DocumentInfoDropdown from '@/components/editor/DocumentInfoDropdown';
import { createTextShare } from '@/lib/api';
import { MAX_TEXT_SIZE } from '@/lib/constants';
import { formatUID, generateUID, normalizeUID, isValidUID } from '@/lib/uid';
import '@/styles/Text.css';

const EXPIRY_MS = {
  '30m': 30 * 60 * 1000,
  '1h':  1 * 60 * 60 * 1000,
  '6h':  6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d':  7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

function buildSessionExpiry(startMs, expiresIn) {
  if (!startMs || !expiresIn || !EXPIRY_MS[expiresIn]) return null;
  return new Date(startMs + EXPIRY_MS[expiresIn]).toISOString();
}

export default function TextPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const initialState = location.state || {};
  const hasSessionSeed = Boolean(
    initialState.title || initialState.password || initialState.expiresIn
  );

  const [content, setContent] = useState('');
  const [title, setTitle] = useState(initialState.title || '');
  const [options, setOptions] = useState({
    expiresIn: initialState.expiresIn || '24h',
    password: initialState.password || ''
  });
  
  const [state, setState] = useState('idle');
  const [shareUid, setShareUid] = useState('');
  const [sessionUid, setSessionUid] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState('');
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [sessionPassword, setSessionPassword] = useState('');
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionCopied, setSessionCopied] = useState(false);

  // Persistent session start — captured once on mount, never resets when modal opens/closes
  const sessionStart = useRef(null);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const isNewSession = hasSessionSeed;
  const storageKey = sessionUid ? `sharenova_editor_state_${sessionUid}` : null;

  useEffect(() => {
    const cleanSessionId = sessionId ? normalizeUID(sessionId) : '';
    if (cleanSessionId && isValidUID(cleanSessionId)) {
      setSessionUid(cleanSessionId);
      return;
    }

    if (hasSessionSeed) {
      const nextUid = generateUID();
      setSessionUid(nextUid);
      navigate(`/text/${nextUid}`, { replace: true, state: initialState });
      return;
    }

    setSessionUid('');
  }, [sessionId, hasSessionSeed, navigate, initialState]);

  // ─── Persistence Logic ───────────────────────────────────
  useEffect(() => {
    if (!storageKey) return;
    sessionStart.current = null;
    const saved = localStorage.getItem(storageKey);
    let parsed = null;
    if (!isNewSession && saved) {
      try {
        parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.options) setOptions(parsed.options);
        if (parsed.shareUid) setShareUid(parsed.shareUid);
        if (parsed.expiresAt) setExpiresAt(parsed.expiresAt);
        if (parsed.sessionStart) sessionStart.current = parsed.sessionStart;
      } catch (e) {
        console.error('Failed to load saved state', e);
      }
    }

    if (isNewSession) {
      localStorage.removeItem(storageKey);
    }

    if (!sessionStart.current) {
      sessionStart.current = Date.now();
    }

    const expirySeed =
      (isNewSession ? initialState.expiresIn : null) ||
      parsed?.sessionExpiresIn ||
      parsed?.options?.expiresIn ||
      options.expiresIn;
    const nextSessionExpiry = parsed?.sessionExpiresAt
      ? parsed.sessionExpiresAt
      : buildSessionExpiry(sessionStart.current, expirySeed);
    setSessionExpiresAt(nextSessionExpiry);

    const nextSessionPassword =
      (isNewSession ? initialState.password : null) ||
      parsed?.sessionPassword ||
      parsed?.options?.password ||
      options.password ||
      '';
    setSessionPassword(nextSessionPassword);
  }, [storageKey, isNewSession]);

  useEffect(() => {
    if (!sessionActive || !storageKey) return;
    const stateToSave = {
      title,
      content,
      options,
      shareUid,
      sessionUid,
      expiresAt,
      sessionStart: sessionStart.current,
      sessionExpiresAt,
      sessionPassword
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [title, content, options, shareUid, sessionUid, expiresAt, sessionExpiresAt, sessionPassword, sessionActive, storageKey]);



  async function handleSubmit() {
    if (!content.trim()) return;
    setState('submitting');
    setError('');

    try {
      const res = await createTextShare({
        content,
        title: title || undefined,
        expiresIn: options.expiresIn,
        password: options.password,
      });

      if (res.success && res.data) {
        setShareUid(res.data.uid);
        setExpiresAt(res.data.expires_at || res.data.expiresAt || null);
        setState('done');
      } else {
        setError(res.error || 'Failed to create share');
        setState('idle');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setState('idle');
    }
  }

  function reset() {
    setContent('');
    setTitle('');
    setState('idle');
    setShareUid('');
    setExpiresAt(null);
    setError('');
    const nextSessionUid = generateUID();
    setSessionUid(nextSessionUid);
    navigate(`/text/${nextSessionUid}`, { replace: true, state: initialState });
    sessionStart.current = Date.now();
    setSessionExpiresAt(buildSessionExpiry(sessionStart.current, options.expiresIn));
    setSessionPassword(options.password || '');
    setSessionActive(true);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }

  function deleteSession() {
    setContent('');
    setTitle('');
    setOptions({ expiresIn: initialState.expiresIn || '24h', password: '' });
    setState('idle');
    setShareUid('');
    setSessionUid('');
    setExpiresAt(null);
    setError('');
    setShowDetails(false);
    sessionStart.current = null;
    setSessionExpiresAt(null);
    setSessionPassword('');
    setSessionActive(false);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    navigate('/text', { replace: true });
  }

  async function copySessionUid() {
    if (!sessionUid) return;
    try {
      await navigator.clipboard.writeText(sessionUid);
      setSessionCopied(true);
      setTimeout(() => setSessionCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = sessionUid;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setSessionCopied(true);
      setTimeout(() => setSessionCopied(false), 2000);
    }
  }

  // Check if we are in "active editing" mode (from home or loaded)
  const isEditing = sessionActive && (sessionUid || title || content.length > 0 || state === 'done');

  return (
    <div className="page-split">
      {/* ── Left 80% Main Area ── */}
      <div className="page-split__main" style={{ padding: 0 }}>
        {!isEditing ? (
          <div className="word-sheet__empty">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="empty-state-wrapper"
            >
              <div className="empty-icon-container">
                <FileText className="word-sheet__empty-icon" />
              </div>
              <div className="empty-text-group">
                <h2 className="empty-title">Word Sheet Ready</h2>
                <p className="empty-desc">
                  To begin, use the <strong>Create Editor</strong> button on the home page.
                  You can also upload files from the sidebar.
                </p>
              </div>
              <Link to="/" className="home-link">
                Go to Home
              </Link>
            </motion.div>
          </div>
        ) : (
          <div className="word-sheet-container">
            {state === 'done' && shareUid ? (
              <div className="editor-success-view">
                <UIDDisplay uid={shareUid} expiresAt={expiresAt} />
                <button onClick={reset} className="page-split__btn-secondary new-sheet-button">
                  Create New Sheet
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="word-sheet"
              >
                <div className="word-sheet-header">
                  <div className="word-sheet-title-group">
                    <h1 className="word-sheet-title">{title || 'Untitled Document'}</h1>
                    {sessionUid && (
                      <div className="session-uid-row">
                        <span className="session-uid-label">Session ID</span>
                        <div className="session-uid-chip">
                          <span className="session-uid-code">{formatUID(sessionUid)}</span>
                          <button
                            type="button"
                            onClick={copySessionUid}
                            className="session-uid-copy"
                            title="Copy session ID"
                          >
                            {sessionCopied ? (
                              <Check size={14} color="#34d399" />
                            ) : (
                              <Copy size={14} color="var(--text-muted)" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className='Details-con'>
                    <button 
                      onClick={() => setShowDetails(!showDetails)}
                      className={`details-toggle-button ${showDetails ? 'active' : ''}`}
                      title="Document Information & Options"
                    >
                      <Info size={20} />
                    </button>

                    <DocumentInfoDropdown 
                      isOpen={showDetails} 
                      onClose={() => setShowDetails(false)} 
                      title={title} 
                      setTitle={setTitle} 
                      options={options} 
                      setOptions={setOptions} 
                      contentLength={content.length} 
                      onDeleteSession={deleteSession}
                      expiresAt={expiresAt}
                      sessionExpiresAt={sessionExpiresAt}
                      sessionPassword={sessionPassword}
                      sessionStart={sessionStart.current}
                    />
                  </div>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, MAX_TEXT_SIZE))}
                  placeholder="Start typing your document here..."
                  className="word-sheet__textarea"
                />

                {error && (
                  <div className="save-error" role="alert">
                    {error}
                  </div>
                )}

                <div className="word-sheet-footer">
                  <span className="char-counter">
                    {content.length.toLocaleString()} Characters / {MAX_TEXT_SIZE.toLocaleString()} Max
                  </span>
                  {state === 'idle' && content.trim() && (
                    <button 
                      onClick={handleSubmit}
                      className="save-button"
                    >
                      <Save size={14} />
                      Save & Get Code
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ── Right 20% Sidebar ── */}
      <aside className="page-split__sidebar">
        <div className="page-split__sidebar-card">
          <span className="page-split__sidebar-label">Upload Files</span>
          <DropZone files={selectedFiles} onFilesChange={setSelectedFiles} />
        </div>
      </aside>
    </div>
  );
}
