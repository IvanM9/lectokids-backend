import { z } from 'zod';

export const multimediaSchema = z.object({
  // Common settings
  STORAGE_PROVIDER: z.enum(['firebase', 'minio']).default('firebase'),
  BUCKET_NAME: z.string(),
  PUBLIC_DIR: z.string().default('./src/public'),
  
  // Firebase settings
  FIREBASE_CONFIG: z.string().optional(),
  
  // MINIO settings
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().transform(Number).optional(),
  MINIO_USE_SSL: z.string().transform((val) => val === 'true').optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_PUBLIC_URL: z.string().optional(),
}).refine((data) => {
  if (data.STORAGE_PROVIDER === 'firebase') {
    return !!data.FIREBASE_CONFIG;
  }
  if (data.STORAGE_PROVIDER === 'minio') {
    return !!(
      data.MINIO_ENDPOINT &&
      data.MINIO_PORT &&
      data.MINIO_ACCESS_KEY &&
      data.MINIO_SECRET_KEY
    );
  }
  return true;
}, {
  message: 'Missing required configuration for selected storage provider',
});
