import { registerAs } from '@nestjs/config';
import path from 'path';

export default registerAs('server', () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  origin: process.env.CORS_ORIGIN || '*',
  prefixApi: process.env.PREFIX_API || '/api',
  viewsDir:
    process.env.VIEWS_DIR || path.join(__dirname, '..', '..', '..', 'views'),
}));
