import { z } from 'zod';

export const aiSchema = z.object({
  MODEL_TEXT: z.string(),
  MODEL_IMAGE: z.string(),
  TEXT_PROVIDER_AI: z.string(),
  IMAGE_PROVIDER_AI: z.string(),
});
