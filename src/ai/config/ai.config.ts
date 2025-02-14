import { registerAs } from '@nestjs/config';
import { TextProviderAI } from '../enums/text-providers-ai.enum';
import { ImageProviderAI } from '../enums/image-providers-ai.enum';

export default registerAs('ai', () => ({
  modelText: process.env.MODEL_TEXT || 'gpt-4o-mini',
  modelImage: process.env.MODEL_IMAGE || 'dall-e-3',
  textProviderAI: process.env.TEXT_PROVIDER_AI || TextProviderAI.openAi,
  imageProviderAI: process.env.IMAGE_PROVIDER_AI || ImageProviderAI.openAi,
}));
