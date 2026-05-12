import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Info, Zap } from 'lucide-react';
import clsx from 'clsx';

const navLinks = [
  { href: '/start', label: 'Start', icon: Zap },
  { href: '/about', label: 'About', icon: Info },
];

const THEME_KEY = 'sharenova-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Navbar() {
  const { pathname } = useLocation();
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-(--nav-bg) border-b border-(--nav-border)"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-(--nav-text) to-(--nav-text-muted) bg-clip-text text-transparent">
            ShareNova
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={clsx(
                    'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-(--nav-text)'
                      : 'text-(--nav-text-muted) hover:text-(--nav-text)'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg bg-(--nav-active-bg) border border-(--nav-border)"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-(--nav-pill-border) bg-(--nav-pill-bg) text-(--nav-text-muted) hover:text-(--nav-text) hover:bg-(--nav-pill-hover) transition-all"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
