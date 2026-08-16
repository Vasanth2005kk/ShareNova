import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Search, Loader2 } from 'lucide-react';
import EditorConfigModal from '@/components/editor/EditorConfigModal';
import { getShareByUID, verifyPassword } from '@/lib/api';
import { normalizeUID, isValidUID } from '@/lib/uid';
import '@/styles/Home.css';

// ─── Animated glowing text component ────────────────────

const demoRooms = [
  { uid: 'A1B2C3', title: 'Team Notes', description: 'Private text sheet', isPrivate: true },
  { uid: 'F4G5H6', title: 'Open Draft', description: 'Quick access editor', isPrivate: false },
  { uid: 'J7K8L9', title: 'Meeting Log', description: 'Secure group room', isPrivate: true },
];

function GlowText() {
  const letters = 'ShareNova'.split('');

  return (
    <h1 className="hero-title-container">
      {/* Background glow layer */}
      <motion.span
        className="hero-title-glow"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <span className="hero-title-glow-text">
          ShareNova
        </span>
      </motion.span>

      {/* Main text with per-letter animation */}
      <span className="hero-title-main" style={{ perspective: '800px' }}>
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            initial={{
              opacity: 0,
              y: 60,
              rotateX: -90,
              filter: 'blur(12px)',
              scale: 0.5,
            }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{
              delay: 0.3 + i * 0.08,
              duration: 1,
              ease: [0.19, 1, 0.22, 1],
            }}
            className="letter-animated"
          >
            {letter}
          </motion.span>
        ))}
      </span>

      {/* Shimmer sweep */}
      <motion.div
        className="shimmer-container"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ delay: 1.5, duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
      >
        <div className="shimmer-sweep" />
      </motion.div>
    </h1>
  );
}

// ─── Main Home Page ──────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    password: '',
    expiresIn: '24h',
    fileEnabled: false
  });

  // Search Room state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(toastTimeoutRef.current);
  }, []);

  function showToast(message) {
    setToastMessage(message);
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(''), 3200);
  }

  async function handleJoinRoom(room) {
    const roomUid = normalizeUID(room.uid);
    if (!roomUid || !isValidUID(roomUid)) {
      showToast('Invalid room code.');
      return;
    }

    if (!room.isPrivate) {
      navigate(`/text/${roomUid}`);
      return;
    }

    setSelectedRoom(room);
    setShowPasswordBox(true);
    setJoinPassword('');
    setSearchError('');
  }

  async function handleVerifyJoinPassword(e) {
    e?.preventDefault();
    if (!selectedRoom) return;

    const roomUid = normalizeUID(selectedRoom.uid);
    setIsVerifyingPassword(true);
    try {
      const res = await verifyPassword(roomUid, joinPassword);
      if (res.success && res.data) {
        navigate(`/text/${roomUid}`);
        return;
      }
      showToast('Incorrect password. Please try again.');
    } catch (err) {
      showToast('Unable to verify password.');
    } finally {
      setIsVerifyingPassword(false);
    }
  }

  async function handleRoomSearch(e) {
    e?.preventDefault();
    const cleanCode = normalizeUID(searchQuery);
    if (!cleanCode || !isValidUID(cleanCode)) {
      setSearchError('Enter a valid 6-digit room code');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const res = await getShareByUID(cleanCode);
      if (!res.success || !res.data) {
        setSearchError('Room code not found or expired');
        setIsSearching(false);
        return;
      }

      // Navigate to the editor sheet room directly
      navigate(`/text/${cleanCode}`);
    } catch (err) {
      setSearchError('Error finding room code');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="page-split">
      {/* ── Left 80% Main Hero Section ── */}
      <div className="home-container page-split__main">
        {/* Hero Section */}
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            className="hero-badge"
          >
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles size={16} color="#fb923c" />
            </motion.div>
            <span className="hero-badge-text">Secure · Temporary · Private</span>
          </motion.div>

          <GlowText />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="hero-description"
          >
            The most secure way to share files and text.{' '}
            <span className="hero-description-highlight">No accounts, no public links.</span>{' '}
            Just a 6-digit code that auto-expires.
          </motion.p>

          {/* Single Main CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.7 }}
            className="hero-cta"
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="cta-button"
            >
              <div className="cta-button-glow" />
              <Zap className="cta-icon" size={24} />
              <span className="cta-text">Create Editor</span>
              <ArrowRight className="cta-arrow" size={20} />
            </button>
          </motion.div>
        </section>

        <EditorConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={modalData}
          onChange={setModalData}
        />

        {/* Footer divider & text */}
        <div className="footer-divider" />
        <footer className="home-footer">
          <p className="footer-text">ShareNova — Secure Temporary Sharing</p>
        </footer>
      </div>

      {/* ── Right 20% Sidebar Panel ── */}
      <aside className="page-split__sidebar">
        {/* Search Room Code Card */}
        <div className="page-split__sidebar-card">
          <span className="page-split__sidebar-label flex items-center gap-2">
            <Search size={14} className="text-orange-400" />
            Search Room
          </span>
          <form onSubmit={handleRoomSearch} className="flex flex-col gap-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError('');
                }}
                placeholder="Enter 6-digit room code..."
                className="page-split__search pr-9"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 p-1 text-(--text-muted) hover:text-orange-400 disabled:opacity-40 transition-colors"
                title="Search Room"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin text-orange-400" /> : <Search size={16} />}
              </button>
            </div>
            {searchError && (
              <span className="text-[11px] text-red-400 font-medium px-1">
                {searchError}
              </span>
            )}
          </form>
        </div>

        <div className="page-split__sidebar-card">
          <span className="page-split__sidebar-label">Active Rooms</span>
          <div className="room-list">
            {demoRooms.map((room) => (
              <div key={room.uid} className="room-list-item">
                <div>
                  <p className="room-title">{room.title}</p>
                  <p className="room-subtitle">{room.description}</p>
                </div>
                <button
                  type="button"
                  className="room-join-button"
                  onClick={() => handleJoinRoom(room)}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        {showPasswordBox && selectedRoom && (
          <div className="page-split__sidebar-card">
            <span className="page-split__sidebar-label">Password required</span>
            <form onSubmit={handleVerifyJoinPassword} className="flex flex-col gap-3">
              <p className="room-password-note">Enter the password for {selectedRoom.title}</p>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Room password"
                className="page-split__search"
              />
              <button
                type="submit"
                disabled={!joinPassword.trim() || isVerifyingPassword}
                className="room-verify-button"
              >
                {isVerifyingPassword ? 'Verifying...' : 'Unlock Room'}
              </button>
            </form>
          </div>
        )}

        {toastMessage && (
          <div className="home-toast">
            {toastMessage}
          </div>
        )}
      </aside>
    </div>
  );
}