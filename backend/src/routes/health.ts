import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// ─── GET /api/health — Health check ─────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service unavailable — database connection failed',
    });
  }
});

export default router;
