import { registerAs } from '@nestjs/config';
import { envSchema } from './validations/redis.validation';

const env = envSchema.parse(process.env);

export default registerAs('redis', () => ({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  ssl: env.REDIS_SSL,
}));
