import { z } from 'zod';

export const jwtSchema = z.object({
  JWT_SECRET_KEY: z.string().default('lectokids_backend_key'),
});
