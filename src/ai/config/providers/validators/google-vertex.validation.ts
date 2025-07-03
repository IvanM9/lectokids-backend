import { z } from 'zod';

export const googleVertexSchema = z.object({
  GOOGLE_VERTEX_EMAIL: z.string(),
  GOOGLE_VERTEX_PRIVATE_KEY: z.string(),
  GOOGLE_VERTEX_PROJECT: z.string(),
  GOOGLE_VERTEX_LOCATION: z.string().default('us-central1'),
});
