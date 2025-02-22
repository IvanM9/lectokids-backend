import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { jwtSchema } from './validations/jwt.validation';

const env = jwtSchema.parse(process.env);

export default registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: env.JWT_SECRET_KEY,
  }),
);
