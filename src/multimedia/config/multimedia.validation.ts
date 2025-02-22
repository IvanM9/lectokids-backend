import { z } from 'zod';

export const multimediaSchema = z.object({
  FIREBASE_CONFIG: z.string(),
  BUCKET_NAME: z.string(),
  PUBLIC_DIR: z.string().default('./src/public'),
});
