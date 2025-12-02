import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test file before running tests
config({ path: resolve(__dirname, '.env.test') });
