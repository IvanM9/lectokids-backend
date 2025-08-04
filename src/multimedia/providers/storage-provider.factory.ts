import { Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import multimediaConfig from '../config/multimedia.config';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { FirebaseStorageProvider } from '../providers/firebase-storage.provider';
import { MinioStorageProvider } from '../providers/minio-storage.provider';
import { StorageProviderEnum } from '../enums/storage-provider.enum';
import firebaseConfig from '../config/firebase.config';
import minioConfig from '../config/minio.config';

@Injectable()
export class StorageProviderFactory {
  private readonly logger = new Logger(StorageProviderFactory.name);

  createStorageProvider(
    config: ConfigType<typeof multimediaConfig>,
    firebaseEnv: ConfigType<typeof firebaseConfig>,
    minioEnv: ConfigType<typeof minioConfig>,
  ): StorageProvider {
    this.logger.log(`Creating storage provider: ${config.storageProvider}`);

    switch (config.storageProvider) {
      case StorageProviderEnum.FIREBASE:
        if (!firebaseEnv.firebaseConfig) {
          throw new Error(
            'Firebase configuration is required when using Firebase storage',
          );
        }
        return new FirebaseStorageProvider(
          config.bucketName,
          firebaseEnv.firebaseConfig,
        );

      case StorageProviderEnum.MINIO:
        if (
          !minioEnv.endPoint ||
          !minioEnv.port ||
          !minioEnv.accessKey ||
          !minioEnv.secretKey
        ) {
          throw new Error('MINIO configuration is incomplete');
        }
        return new MinioStorageProvider(
          minioEnv.endPoint,
          minioEnv.port,
          minioEnv.useSSL ?? false,
          minioEnv.accessKey,
          minioEnv.secretKey,
          config.bucketName,
          minioEnv.publicUrl,
        );

      default:
        throw new Error(
          `Unsupported storage provider: ${config.storageProvider}`,
        );
    }
  }
}
