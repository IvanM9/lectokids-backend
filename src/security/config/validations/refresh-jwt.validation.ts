import { z } from 'zod';

export const refreshJwtSchema = z.object({
  REFRESH_JWT_SECRET: z.string().default('lectokids_backend_refresh_key'),
  REFRESH_JWT_EXPIRE_IN: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('43200'),
});
