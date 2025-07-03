import { registerAs } from '@nestjs/config';

export default registerAs('google-vertex', () => ({
  email: process.env.GOOGLE_VERTEX_EMAIL,
  privateKey: process.env.GOOGLE_VERTEX_PRIVATE_KEY,
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION,
}));
