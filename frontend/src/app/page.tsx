'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Upload, FileText, Search, Shield, Clock, Zap, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'UID-First Security',
    desc: 'No public URLs. Retrieve files using a 12-digit cryptographic code.',
    gradient: 'from-violet-500/20 to-indigo-500/20',
    border: 'border-violet-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: Clock,
    title: 'Auto-Expiry',
    desc: 'Files are automatically deleted after your chosen time window.',
    gradient: 'from-fuchsia-500/20 to-pink-500/20',
    border: 'border-fuchsia-500/20',
    iconColor: 'text-fuchsia-400',
  },
  {
    icon: Zap,
    title: 'Instant Sharing',
    desc: 'Upload files or paste text. Get a code. Share it. That simple.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
  },
];

const steps = [
  { num: '01', title: 'Upload or Paste', desc: 'Drop your files or paste text into the editor.' },
  { num: '02', title: 'Get Your Code', desc: 'Receive a unique 12-digit share code instantly.' },
  { num: '03', title: 'Share Securely', desc: 'Send the code. Recipient retrieves at their leisure.' },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.07] blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-fuchsia-500/[0.05] blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Secure. Temporary. Private.
            </motion.div>

            {/* Brand Name — per-letter staggered animation */}
            <h1 className="text-7xl sm:text-[9rem] font-bold leading-[1] tracking-tight">
              <span className="inline-flex overflow-hidden">
                {'Share'.split('').map((letter, i) => (
                  <motion.span
                    key={`s-${i}`}
                    initial={{ y: 80, opacity: 0, rotateX: 40 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.06,
                      duration: 0.8,
                      ease: [0.19, 1, 0.22, 1],
                    }}
                    className="inline-block bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
              <span className="inline-flex overflow-hidden">
                {'Nova'.split('').map((letter, i) => (
                  <motion.span
                    key={`n-${i}`}
                    initial={{ y: 80, opacity: 0, rotateX: 40 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{
                      delay: 0.6 + i * 0.06,
                      duration: 0.8,
                      ease: [0.19, 1, 0.22, 1],
                    }}
                    className="inline-block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent animate-gradient"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            </h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              className="text-xl sm:text-2xl text-white/40 font-medium tracking-wide"
            >
              Secure file &amp; text sharing with a 12-digit code
            </motion.p>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              No accounts. No public links. Upload files or text, get a secure code,
              and share it privately. Everything auto-expires.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/upload"
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="w-5 h-5" />
                Upload Files
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/retrieve"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/80 font-medium hover:bg-white/[0.08] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-5 h-5" />
                Retrieve a Share
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Security by design
            </h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Every architectural decision prioritizes your privacy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl bg-white/[0.02] border ${f.border} backdrop-blur-xl hover:bg-white/[0.04] transition-all group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-white/50">Three steps to secure sharing.</p>
          </motion.div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <span className="text-3xl font-bold bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-white/50">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl p-12 bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.08] border border-white/[0.06]"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to share?</h2>
          <p className="text-white/50 mb-8">Start sharing files and text securely in seconds.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium hover:shadow-xl hover:shadow-violet-500/25 transition-all"
            >
              <Upload className="w-5 h-5" />
              Upload Files
            </Link>
            <Link
              href="/text"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/80 font-medium hover:bg-white/[0.08] transition-all"
            >
              <FileText className="w-5 h-5" />
              Share Text
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-white/30">
          <p>© 2026 ShareNova. All rights reserved.</p>
          <p>Built with privacy in mind.</p>
        </div>
      </footer>
    </div>
  );
}
