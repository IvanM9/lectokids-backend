import { z } from 'zod';
import { StorageProviderEnum } from '../../enums/storage-provider.enum';

export const multimediaSchema = z.object({
  STORAGE_PROVIDER: z.enum([
    StorageProviderEnum.FIREBASE,
    StorageProviderEnum.MINIO,
  ]),
  PUBLIC_DIR: z.string().default('./src/public'),
  BUCKET_NAME: z.string().default('lectokids'),
});
