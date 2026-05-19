import { motion } from 'framer-motion';
import '@/styles/ProgressBar.css';

export default function ProgressBar({ progress, label }) {
  return (
    <div className="progress-bar-container">
      <div className="progress-info">
        <span className="progress-label">{label}</span>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>
      <div className="progress-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="progress-fill"
        />
      </div>
    </div>
  );
}
