import { z } from 'zod';

export const adminSchema = z.object({
  ADMIN_USER: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('admin'),
});
