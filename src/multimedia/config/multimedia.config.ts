import { registerAs } from '@nestjs/config';

export default registerAs('multimedia', () => ({
  firebaseConfig: process.env.FIREBASE_CONFIG,
  bucketName: process.env.BUCKET_NAME,
  publicDir: process.env.PUBLIC_DIR || './src/public',
}));
