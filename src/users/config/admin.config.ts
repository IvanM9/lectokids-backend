import { registerAs } from '@nestjs/config';
import { adminSchema } from './admin.validate';

const env = adminSchema.parse(process.env);

export default registerAs('admin', () => ({
  user: env.ADMIN_USER,
  password: env.ADMIN_PASSWORD,
}));
