import path from 'path';
import { z } from 'zod';

export const serverSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('4000'),
  CORS_ORIGIN: z.string().default('*'),
  PREFIX_API: z.string().default('/api'),
  VIEWS_DIR: z
    .string()
    .default(path.join(__dirname, '..', '..', '..', 'views')),
});
