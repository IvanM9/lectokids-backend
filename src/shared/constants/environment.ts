// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
export const ENVIRONMENT = {
  JWT_SECRET_KEY: 'secret',
  FIREBASE_CONFIG: process.env.FIREBASE_COFNIG ?? 'firebase.json',
  PUBLIC_DIR: process.env.PUBLIC_DIR || './src/public',
  BUCKET_NAME: process.env.BUCKET_NAME,
  API_KEY_AI: process.env.API_KEY_AI,
};
