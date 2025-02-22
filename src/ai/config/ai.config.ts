import { registerAs } from '@nestjs/config';
import { aiSchema } from './ai.validation';

const env = aiSchema.parse(process.env);

export default registerAs('ai', () => ({
  modelText: env.MODEL_TEXT,
  modelImage: env.MODEL_IMAGE,
  textProviderAI: env.TEXT_PROVIDER_AI,
  imageProviderAI: env.IMAGE_PROVIDER_AI,
}));
