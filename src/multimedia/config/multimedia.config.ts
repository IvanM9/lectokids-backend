import { registerAs } from '@nestjs/config';
import { multimediaSchema } from './multimedia.validation';

const env = multimediaSchema.parse(process.env);

export default registerAs('multimedia', () => ({
  firebaseConfig: env.FIREBASE_CONFIG,
  bucketName: env.BUCKET_NAME,
  publicDir: env.PUBLIC_DIR,
}));
