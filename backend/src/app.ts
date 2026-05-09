import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { startCleanupWorker } from './services/CleanupService';

// Route imports
import shareRoutes from './routes/shares';
import fileRoutes from './routes/files';
import downloadRoutes from './routes/download';
import healthRoutes from './routes/health';

const app = express();

// ─── Global middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Session-Token'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ─── Routes ─────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/download', downloadRoutes);

// ─── 404 handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// ─── Global error handler ───────────────────────────────
app.use(errorHandler);

// ─── Start server ───────────────────────────────────────
const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🚀 ShareNova API Server               ║
  ║   Running on port ${String(PORT).padEnd(24)}║
  ║   Environment: ${String(env.NODE_ENV).padEnd(23)}║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `);

  // Start the cleanup cron worker
  startCleanupWorker();
});

export default app;
