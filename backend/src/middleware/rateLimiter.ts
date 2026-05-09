import rateLimit from 'express-rate-limit';

/**
 * Rate limiters for different endpoint categories.
 * Uses in-memory store (swap to Redis store for multi-instance deployments).
 */

// General API rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

// UID retrieval — 20 requests per IP per minute
export const retrievalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many retrieval attempts. Please wait a moment.',
  },
});

// Password attempts — 5 per UID per 10 minutes (brute-force protection)
export const passwordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + UID combination
    const uid = req.params.uid || 'unknown';
    return `${req.ip}:${uid}`;
  },
  message: {
    success: false,
    error: 'Too many password attempts. Please try again in 10 minutes.',
  },
});

// Upload — 10 requests per IP per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload limit reached. Please try again later.',
  },
});
