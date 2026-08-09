import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, Loader2, Sparkles, Save, Info, Database, 
  CheckCircle2, Copy, Check, RefreshCw, Radio, Plus, UploadCloud, Search
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import UIDDisplay from '@/components/share/UIDDisplay';
import DropZone from '@/components/upload/DropZone';
import DocumentInfoDropdown from '@/components/editor/DocumentInfoDropdown';
import { createTextShare, updateTextShare, getTextContent, getShareByUID } from '@/lib/api';
import { MAX_TEXT_SIZE } from '@/lib/constants';
import { generateUID, normalizeUID, isValidUID, formatUID } from '@/lib/uid';
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

  // DB Sync & Room status state
  const [dbStatus, setDbStatus] = useState('idle'); // 'idle' | 'syncing' | 'connected' | 'error'
  const [copiedCode, setCopiedCode] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [isFetchingRoom, setIsFetchingRoom] = useState(false);

  // Persistent session start — captured once on mount
  const sessionStart = useRef(null);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const isNewSession = hasSessionSeed;
  const storageKey = sessionUid ? `sharenova_editor_state_${sessionUid}` : null;

  // Initialize room UID from URL or seed
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

  // Fetch Room data from DB if available when sessionUid changes
  const fetchRoomFromDb = useCallback(async (uidToFetch) => {
    if (!uidToFetch || !isValidUID(uidToFetch)) return;
    setIsFetchingRoom(true);
    try {
      const metadataRes = await getShareByUID(uidToFetch);
      if (metadataRes.success && metadataRes.data) {
        const contentRes = await getTextContent(uidToFetch);
        if (contentRes.success && contentRes.data) {
          setContent(contentRes.data.content || '');
          if (contentRes.data.title) setTitle(contentRes.data.title);
          setShareUid(uidToFetch);
          setDbStatus('connected');
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      } else {
        setDbStatus('idle');
      }
    } catch (err) {
      console.warn('Room not found on backend DB yet:', err);
      setDbStatus('idle');
    } finally {
      setIsFetchingRoom(false);
    }
  }, []);

  useEffect(() => {
    if (sessionUid && !hasSessionSeed) {
      fetchRoomFromDb(sessionUid);
    }
  }, [sessionUid, hasSessionSeed, fetchRoomFromDb]);

  // ─── Persistence & Sync Logic ─────────────────────────────
  useEffect(() => {
    if (!storageKey) return;
    sessionStart.current = null;
    const saved = localStorage.getItem(storageKey);
    let parsed = null;
    if (!isNewSession && saved) {
      try {
        parsed = JSON.parse(saved);
        if (parsed.title && !title) setTitle(parsed.title);
        if (parsed.content && !content) setContent(parsed.content);
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

  // Auto-save to LocalStorage
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

  // ─── Save & Sync to Backend DB ───────────────────────────
  async function handleSubmit() {
    if (!content.trim()) return;
    setState('submitting');
    setDbStatus('syncing');
    setError('');

    const targetUid = shareUid || sessionUid || generateUID();

    try {
      let res;
      if (shareUid) {
        // Update existing room sheet in DB
        res = await updateTextShare(targetUid, {
          content,
          title: title || 'Untitled Room Document',
        });
      } else {
        // Create text share room in DB
        res = await createTextShare({
          content,
          title: title || 'Untitled Room Document',
          expiresIn: options.expiresIn,
          password: options.password,
        });
      }

      if (res.success && res.data) {
        const activeUid = res.data.uid || targetUid;
        setShareUid(activeUid);
        setSessionUid(activeUid);
        setExpiresAt(res.data.expires_at || res.data.expiresAt || null);
        setState('done');
        setDbStatus('connected');
        setLastSyncedAt(new Date().toLocaleTimeString());
        navigate(`/text/${activeUid}`, { replace: true });
      } else {
        setError(res.error || 'Failed to sync with backend DB');
        setState('idle');
        setDbStatus('error');
      }
    } catch (err) {
      setError('Connection error. Could not sync to database.');
      setState('idle');
      setDbStatus('error');
    }
  }

  function handleCopyRoomCode() {
    const code = shareUid || sessionUid;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function reset() {
    setContent('');
    setTitle('');
    setState('idle');
    setDbStatus('idle');
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
    setDbStatus('idle');
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

  const activeRoomUid = shareUid || sessionUid;
  const isEditing = sessionActive && (activeRoomUid || title || content.length > 0 || state === 'done');

  return (
    <div className="page-split">
      {/* ── Left 80% Main Content Area ── */}
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
                <h2 className="empty-title">Live Editor Room Ready</h2>
                <p className="empty-desc">
                  Start typing to create a sheet or use the button below to initialize a new room connected to the backend database.
                </p>
              </div>
              <div className="flex gap-3 items-center justify-center">
                <button onClick={reset} className="page-split__btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                  <Plus size={18} />
                  Create New Room Sheet
                </button>
                <Link to="/" className="home-link">
                  Go to Home
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="word-sheet-container">
            {state === 'done' && shareUid ? (
              <div className="editor-success-view">
                <UIDDisplay uid={shareUid} expiresAt={expiresAt} />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setState('idle')} className="page-split__btn-secondary flex-1">
                    Continue Editing Sheet
                  </button>
                  <button onClick={reset} className="page-split__btn-primary flex-1">
                    Create New Sheet
                  </button>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="word-sheet"
              >
                {/* Sheet Top Header */}
                <div className="word-sheet-header">
                  <div className="word-sheet-title-group">
                    <div className="flex items-center gap-3">
                      <h1 className="word-sheet-title">{title || 'Untitled Document'}</h1>
                      
                      {/* Live DB Indicator */}
                      <div className={`db-status-badge ${dbStatus}`}>
                        {dbStatus === 'syncing' ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-amber-400" />
                            <span>Syncing DB...</span>
                          </>
                        ) : dbStatus === 'connected' ? (
                          <>
                            <div className="status-dot connected" />
                            <span>DB Synced</span>
                          </>
                        ) : (
                          <>
                            <div className="status-dot idle" />
                            <span>Room Ready</span>
                          </>
                        )}
                      </div>
                    </div>

                    {activeRoomUid && (
                      <div className="session-uid-row">
                        <span className="session-uid-label">Room Base ID:</span>
                        <div className="session-uid-chip">
                          <span className="session-uid-code">{formatUID(activeRoomUid)}</span>
                          <button 
                            onClick={handleCopyRoomCode} 
                            className="session-uid-copy"
                            title="Copy Room Code"
                          >
                            {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='Details-con flex items-center gap-2'>
                    <button
                      onClick={handleSubmit}
                      disabled={state === 'submitting' || !content.trim()}
                      className="save-button"
                      title="Save sheet and update database room"
                    >
                      {state === 'submitting' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Database size={14} />
                      )}
                      <span>{dbStatus === 'connected' ? 'Update DB Sheet' : 'Save & Connect DB'}</span>
                    </button>

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
                      sessionUid={activeRoomUid}
                    />
                  </div>
                </div>

                {/* Text Area */}
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value.slice(0, MAX_TEXT_SIZE));
                    if (dbStatus === 'connected') setDbStatus('idle');
                  }}
                  placeholder="Start typing your document here... Content is backed up locally and syncs to backend database."
                  className="word-sheet__textarea"
                />

                {error && (
                  <div className="save-error" role="alert">
                    {error}
                  </div>
                )}

                {/* Sheet Bottom Footer */}
                <div className="word-sheet-footer">
                  <span className="char-counter">
                    {content.length.toLocaleString()} / {MAX_TEXT_SIZE.toLocaleString()} Max Characters
                  </span>
                  
                  <div className="flex items-center gap-3">
                    {lastSyncedAt && (
                      <span className="text-xs text-(--text-dim)">
                        Last DB Sync: {lastSyncedAt}
                      </span>
                    )}
                    
                    {content.trim() && (
                      <button 
                        onClick={handleSubmit}
                        disabled={state === 'submitting'}
                        className="save-button"
                      >
                        {state === 'submitting' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save & Get Code
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ── Right 20% Sidebar Panel ── */}
      <aside className="page-split__sidebar">
        {/* Room Info Card */}
        {activeRoomUid && (
          <div className="page-split__sidebar-card">
            <div className="flex items-center justify-between">
              <span className="page-split__sidebar-label flex items-center gap-2">
                <Radio size={14} className="text-orange-400" />
                Current Room Base
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                Active
              </span>
            </div>

            <div className="p-3 rounded-xl bg-(--surface-2) border border-(--border-subtle) space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-(--text-muted)">Room Code</span>
                <span className="font-mono font-bold text-sm text-orange-400">{formatUID(activeRoomUid)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-(--text-muted)">Database Status</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {dbStatus === 'connected' ? 'DB Synced' : 'Ready to Sync'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyRoomCode}
              className="page-split__btn-secondary flex items-center justify-center gap-2"
            >
              {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedCode ? 'Room Code Copied!' : 'Copy Room Code'}
            </button>
          </div>
        )}

        {/* Upload Files Card */}
        <div className="page-split__sidebar-card">
          <span className="page-split__sidebar-label flex items-center gap-2">
            <UploadCloud size={14} className="text-amber-400" />
            Upload Files
          </span>
          <DropZone files={selectedFiles} onFilesChange={setSelectedFiles} />
        </div>

        {/* Quick Actions Card */}
        <div className="page-split__sidebar-card">
          <span className="page-split__sidebar-label">Quick Actions</span>
          <button onClick={reset} className="page-split__btn-secondary flex items-center justify-center gap-2">
            <Plus size={14} />
            Create New Sheet Room
          </button>
        </div>
      </aside>
    </div>
  );
}
