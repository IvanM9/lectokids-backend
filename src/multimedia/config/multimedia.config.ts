import { registerAs } from '@nestjs/config';
import { multimediaSchema } from './multimedia.validation';

const env = multimediaSchema.parse(process.env);

export default registerAs('multimedia', () => ({
  // Common settings
  storageProvider: env.STORAGE_PROVIDER,
  bucketName: env.BUCKET_NAME,
  publicDir: env.PUBLIC_DIR,
  
  // Firebase settings
  firebaseConfig: env.FIREBASE_CONFIG,
  
  // MINIO settings
  minioEndpoint: env.MINIO_ENDPOINT,
  minioPort: env.MINIO_PORT,
  minioUseSSL: env.MINIO_USE_SSL,
  minioAccessKey: env.MINIO_ACCESS_KEY,
  minioSecretKey: env.MINIO_SECRET_KEY,
  minioPublicUrl: env.MINIO_PUBLIC_URL,
}));
