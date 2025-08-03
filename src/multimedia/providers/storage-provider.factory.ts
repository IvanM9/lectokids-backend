import { Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import multimediaConfig from '../config/multimedia.config';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { FirebaseStorageProvider } from '../providers/firebase-storage.provider';
import { MinioStorageProvider } from '../providers/minio-storage.provider';

@Injectable()
export class StorageProviderFactory {
  private readonly logger = new Logger(StorageProviderFactory.name);

  createStorageProvider(
    config: ConfigType<typeof multimediaConfig>,
  ): StorageProvider {
    this.logger.log(`Creating storage provider: ${config.storageProvider}`);

    switch (config.storageProvider) {
      case 'firebase':
        if (!config.firebaseConfig) {
          throw new Error('Firebase configuration is required when using Firebase storage');
        }
        return new FirebaseStorageProvider(config.bucketName, config.firebaseConfig);

      case 'minio':
        if (
          !config.minioEndpoint ||
          !config.minioPort ||
          !config.minioAccessKey ||
          !config.minioSecretKey
        ) {
          throw new Error('MINIO configuration is incomplete');
        }
        return new MinioStorageProvider(
          config.minioEndpoint,
          config.minioPort,
          config.minioUseSSL ?? false,
          config.minioAccessKey,
          config.minioSecretKey,
          config.bucketName,
          config.minioPublicUrl,
        );

      default:
        throw new Error(`Unsupported storage provider: ${config.storageProvider}`);
    }
  }
}