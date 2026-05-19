import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  Download,
  Lock,
  Clock,
  Shield,
  FileText,
  EyeOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Press Start now',
    lines: ['Go to the home page.', 'Tap the Start now button.'],
    image: '/about/step-start.png',
    alt: 'Home page with the Start now button highlighted.',
  },
  {
    step: '02',
    title: 'Upload files and add text',
    lines: ['Drop files or click browse.', 'Write text and tap Add text file.'],
    image: '/about/step-upload-text.png',
    alt: 'Upload panel showing file drop area and text file box highlighted.',
  },
  {
    step: '03',
    title: 'Set time and password',
    lines: ['Choose expiry time.', 'Add a password if you want.', 'Press Upload & Get Code.'],
    image: '/about/step-options.png',
    alt: 'Share options and Upload & Get Code button highlighted.',
  },
  {
    step: '04',
    title: 'Receive with the code',
    lines: ['Enter the 6-digit code.', 'Press the arrow to open.'],
    image: '/about/step-receive.png',
    alt: 'Receive input with the arrow button highlighted.',
  },
];

const features = [
  {
    title: 'No sign up',
    description: 'Use it right away. No account needed.',
    icon: Sparkles,
  },
  {
    title: 'Text or files',
    description: 'Share notes, code, or files in seconds.',
    icon: FileText,
  },
  {
    title: '6-digit code',
    description: 'Only people with the code can open it.',
    icon: Lock,
  },
  {
    title: 'Optional password',
    description: 'Add a password for extra safety.',
    icon: Shield,
  },
  {
    title: 'Time limits',
    description: 'Set a timer from 1 hour to 30 days.',
    icon: Clock,
  },
  {
    title: 'Auto cleanup',
    description: 'When time ends, the share is removed.',
    icon: EyeOff,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function AboutBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-24 left-8 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
    </div>
  );
}

function InstructionCard({ step, title, lines, image, alt, flip }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`flex flex-col gap-6 rounded-3xl border border-(--border-soft) bg-(--surface-1) p-6 md:items-center md:gap-10 ${
        flip ? 'md:flex-row-reverse' : 'md:flex-row'
      }`}
    >
      <div className="w-full md:w-1/2 text-center md:text-left">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-(--text-dim) justify-center md:justify-start">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-3) text-(--text-secondary)">
            {step}
          </span>
          Step
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-(--text-primary)">{title}</h3>
        <div className="mt-4 space-y-2 text-sm text-(--text-muted)">
          {lines.map((line) => (
            <p key={line} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>
      <div className="w-full md:w-1/2">
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-2) p-3 md:p-4">
          <img
            src={image}
            alt={alt}
            className="w-full rounded-xl border border-(--border-subtle) object-contain"
            loading="lazy"
          />
        </div>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-(--border-subtle) bg-(--surface-1) p-5 transition-colors hover:border-(--border-strong)"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/15 to-amber-500/15">
        <Icon className="h-5 w-5 text-orange-400" />
      </div>
      <h4 className="mt-4 text-base font-semibold text-(--text-primary)">{title}</h4>
      <p className="mt-2 text-sm text-(--text-muted) leading-relaxed">{description}</p>
    </motion.div>
  );
}


export default function AboutPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackdrop />

      <section className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 pt-20 pb-14 md:flex-row md:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-1"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-(--border-soft) bg-(--surface-2) px-4 py-2 text-xs uppercase tracking-[0.2em] text-(--text-dim)">
            About ShareNova
          </div>
          <h1 className="mt-5 text-4xl font-bold text-(--text-primary) sm:text-5xl">
            Share files and text with a simple code.
          </h1>
          <p className="mt-4 text-lg text-(--text-muted) leading-relaxed">
            ShareNova lets anyone send files or text without an account. The receiver only needs a short code to open the share.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/start"
              className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
            >
              Start sharing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/start"
              className="rounded-2xl border border-(--border-soft) bg-(--surface-2) px-6 py-3 text-sm font-semibold text-(--text-secondary) transition-all hover:border-(--border-strong) hover:text-(--text-primary)"
            >
              Open a share
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="flex-1"
        >
          <div className="rounded-3xl border border-(--border-soft) bg-(--surface-1) p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                <Upload className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--text-primary)">No sign up</p>
                <p className="text-xs text-(--text-muted)">Just drop and share.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Download className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--text-primary)">One code</p>
                <p className="text-xs text-(--text-muted)">Open it from any device.</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-(--border-subtle) bg-(--surface-2) p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-(--text-dim)">The flow</p>
              <div className="mt-3 grid gap-3">
                {['Start now', 'Upload', 'Set options', 'Receive'].map((label, index) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(--surface-3) text-[11px] text-(--text-secondary)">
                      {index + 1}
                    </div>
                    <span className="text-sm text-(--text-secondary)">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-dim)">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-(--text-primary) sm:text-4xl">
            A clear, simple path for everyone.
          </h2>
          <p className="mt-3 text-sm text-(--text-muted)">
            Each step is short and simple. You always know what to do next.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-10 space-y-6"
        >
          {steps.map((step, index) => (
            <InstructionCard key={step.step} {...step} flip={index % 2 === 1} />
          ))}
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-dim)">What ShareNova has</p>
          <h2 className="mt-3 text-3xl font-semibold text-(--text-primary) sm:text-4xl">
            Everything you need. Nothing you do not.
          </h2>
          <p className="mt-3 text-sm text-(--text-muted)">
            These features keep sharing fast, private, and easy to understand.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-(--border-soft) bg-gradient-to-br from-orange-500/[0.1] to-amber-500/[0.06] p-8 text-center"
        >
          <h3 className="text-2xl font-semibold text-(--text-primary)">Ready to share?</h3>
          <p className="mt-2 text-sm text-(--text-muted)">Start in seconds. No sign up required.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/start"
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25"
            >
              Share now
            </Link>
            <Link
              to="/start"
              className="rounded-2xl border border-(--border-soft) bg-(--surface-2) px-6 py-3 text-sm font-semibold text-(--text-secondary)"
            >
              I have a code
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
