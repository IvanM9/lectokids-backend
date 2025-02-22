import { registerAs } from '@nestjs/config';
import { serverSchema } from './validations/server.validation';

const env = serverSchema.parse(process.env);

export default registerAs('server', () => ({
  port: env.PORT,
  origin: env.CORS_ORIGIN,
  prefixApi: env.PREFIX_API,
  viewsDir: env.VIEWS_DIR,
}));
