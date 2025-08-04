import { registerAs } from '@nestjs/config';
import { multimediaSchema } from './validations/multimedia.validation';

const env = multimediaSchema.parse(process.env);

export default registerAs('multimedia', () => ({
  storageProvider: env.STORAGE_PROVIDER,
  publicDir: env.PUBLIC_DIR,
  bucketName: env.BUCKET_NAME,
}));
