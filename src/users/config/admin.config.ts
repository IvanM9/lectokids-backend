import { registerAs } from '@nestjs/config';

export default registerAs('admin', () => ({
  user: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin',
}));
