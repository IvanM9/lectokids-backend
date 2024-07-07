import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
export const ENVIRONMENT = {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'secret',
  FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
  PUBLIC_DIR: process.env.PUBLIC_DIR || './src/public',
  BUCKET_NAME: process.env.BUCKET_NAME,
  API_KEY_AI: process.env.API_KEY_AI,
  MODEL_TEXT: process.env.MODEL_TEXT || 'gpt-3.5-turbo',
  MODEL_IMAGE: process.env.MODEL_IMAGE || 'dall-e-3',
  VIEWS_DIR:
    process.env.VIEWS_DIR || path.join(__dirname, '..', '..', '..', 'views'),
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
};
