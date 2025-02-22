import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { refreshJwtSchema } from './validations/refresh-jwt.validation';

const env = refreshJwtSchema.parse(process.env);

export default registerAs(
  'refresh-jwt',
  (): JwtSignOptions => ({
    secret: env.REFRESH_JWT_SECRET,
    expiresIn: env.REFRESH_JWT_EXPIRE_IN,
  }),
);
