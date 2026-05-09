import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1),

  // Cloudflare R2 / S3
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url().optional(),

  // Security
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  SESSION_SECRET: z.string().min(16),

  // Limits
  MAX_UPLOAD_BYTES: z.string().default('524288000').transform(Number), // 500MB

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
      console.error('❌ Environment validation failed:\n' + missing.join('\n'));
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
