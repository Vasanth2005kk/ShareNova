import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Sparkles, ArrowRight } from 'lucide-react';

// ─── Animated glowing text component ────────────────────

function GlowText() {
  const letters = 'ShareNova'.split('');

  return (
    <h1 className="relative inline-block">
      {/* Background glow layer */}
      <motion.span
        className="absolute inset-0 blur-2xl opacity-60 pointer-events-none select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
          ShareNova
        </span>
      </motion.span>

      {/* Main text with per-letter animation */}
      <span className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight" style={{ perspective: '800px' }}>
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
            animate={{
              opacity: 1,
              y: 0,
              rotateX: 0,
              filter: 'blur(0px)',
              scale: 1,
            }}
            transition={{
              delay: 0.3 + i * 0.08,
              duration: 1,
              ease: [0.19, 1, 0.22, 1],
            }}
            className="inline-block bg-gradient-to-b from-(--hero-text-from) via-(--hero-text-via) to-(--hero-text-to) bg-clip-text text-transparent"
            style={{ transformOrigin: 'bottom center' }}
          >
            {letter}
          </motion.span>
        ))}
      </span>

      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ delay: 1.5, duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
      >
        <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-(--text-faint) to-transparent skew-x-[-20deg]" />
      </motion.div>
    </h1>
  );
}

// ─── Floating particle background ───────────────────────

function FloatingOrbs() {
  const orbs = [
    { size: 300, x: '15%', y: '20%', color: 'orange', delay: 0 },
    { size: 400, x: '75%', y: '30%', color: 'amber', delay: 2 },
    { size: 200, x: '50%', y: '70%', color: 'cyan', delay: 4 },
    { size: 250, x: '85%', y: '75%', color: 'orange', delay: 1 },
    { size: 150, x: '10%', y: '80%', color: 'amber', delay: 3 },
  ];

  const colorMap = {
    orange: 'bg-orange-500/[0.06]',
    amber: 'bg-amber-500/[0.05]',
    cyan: 'bg-cyan-500/[0.04]',
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${colorMap[orb.color]}`}
          style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, 0, -15, 0],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center relative overflow-hidden">
      <FloatingOrbs />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-(--surface-2) border border-(--border-soft) mb-10 backdrop-blur-sm"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
          </motion.div>
          <span className="text-sm text-(--text-muted) font-medium">Secure · Temporary · Private</span>
        </motion.div>

        {/* Animated Title */}
        <GlowText />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-lg sm:text-xl text-(--text-muted) max-w-2xl mx-auto mt-8 leading-relaxed"
        >
          The most secure way to share files and text.{' '}
          <span className="text-(--text-secondary)">No accounts, no public links.</span>{' '}
          Just a 12-digit code that auto-expires.
        </motion.p>

        {/* Main Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.7 }}
          className="flex items-center justify-center mt-12"
        >
          <Link
            to="/start"
            className="group relative flex items-center gap-3 px-12 py-4.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-lg shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Upload className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Start now</span>
            <ArrowRight className="w-4 h-4 relative z-10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </Link>
        </motion.div>
      </section>

      {/* Divider line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 2, duration: 1, ease: [0.19, 1, 0.22, 1] }}
        className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-(--divider-line) to-transparent"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1, duration: 0.6 }}
        className="relative z-10 mt-10 text-center"
      >
        <Link
          to="/about"
          className="text-sm text-(--text-muted) hover:text-(--text-primary) transition-colors"
        >
          See how ShareNova works
        </Link>
      </motion.div>

      <div className="w-full h-px mt-16 bg-gradient-to-r from-transparent via-(--divider-line) to-transparent" />
      <footer className="relative z-10 px-6 py-8 text-center">
        <p className="text-xs text-(--text-faint)">ShareNova - Secure Temporary Sharing</p>
      </footer>
    </div>
  );
}
