import { Test, TestingModule } from '@nestjs/testing';
import { StorageProviderFactory } from '../src/multimedia/providers/storage-provider.factory';
import { FirebaseStorageProvider } from '../src/multimedia/providers/firebase-storage.provider';
import { MinioStorageProvider } from '../src/multimedia/providers/minio-storage.provider';

describe('StorageProviderFactory', () => {
  let factory: StorageProviderFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageProviderFactory],
    }).compile();

    factory = module.get<StorageProviderFactory>(StorageProviderFactory);
  });

  describe('createStorageProvider', () => {
    it('should create Firebase storage provider when configured', () => {
      const config = {
        storageProvider: 'firebase' as const,
        bucketName: 'test-bucket',
        firebaseConfig: '{"test": "config"}',
        publicDir: './src/public',
        minioEndpoint: undefined,
        minioPort: undefined,
        minioUseSSL: undefined,
        minioAccessKey: undefined,
        minioSecretKey: undefined,
        minioPublicUrl: undefined,
      };

      const provider = factory.createStorageProvider(config);
      expect(provider).toBeInstanceOf(FirebaseStorageProvider);
    });

    it('should create MINIO storage provider when configured', () => {
      const config = {
        storageProvider: 'minio' as const,
        bucketName: 'test-bucket',
        firebaseConfig: undefined,
        publicDir: './src/public',
        minioEndpoint: 'localhost',
        minioPort: 9000,
        minioUseSSL: false,
        minioAccessKey: 'test-key',
        minioSecretKey: 'test-secret',
        minioPublicUrl: 'http://localhost:9000',
      };

      const provider = factory.createStorageProvider(config);
      expect(provider).toBeInstanceOf(MinioStorageProvider);
    });

    it('should throw error for unsupported storage provider', () => {
      const config = {
        storageProvider: 'unsupported' as any,
        bucketName: 'test-bucket',
        firebaseConfig: undefined,
        publicDir: './src/public',
        minioEndpoint: undefined,
        minioPort: undefined,
        minioUseSSL: undefined,
        minioAccessKey: undefined,
        minioSecretKey: undefined,
        minioPublicUrl: undefined,
      };

      expect(() => factory.createStorageProvider(config)).toThrow(
        'Unsupported storage provider: unsupported',
      );
    });

    it('should throw error when Firebase config is missing', () => {
      const config = {
        storageProvider: 'firebase' as const,
        bucketName: 'test-bucket',
        firebaseConfig: undefined,
        publicDir: './src/public',
        minioEndpoint: undefined,
        minioPort: undefined,
        minioUseSSL: undefined,
        minioAccessKey: undefined,
        minioSecretKey: undefined,
        minioPublicUrl: undefined,
      };

      expect(() => factory.createStorageProvider(config)).toThrow(
        'Firebase configuration is required when using Firebase storage',
      );
    });

    it('should throw error when MINIO config is incomplete', () => {
      const config = {
        storageProvider: 'minio' as const,
        bucketName: 'test-bucket',
        firebaseConfig: undefined,
        publicDir: './src/public',
        minioEndpoint: 'localhost',
        minioPort: undefined, // Missing required config
        minioUseSSL: false,
        minioAccessKey: 'test-key',
        minioSecretKey: 'test-secret',
        minioPublicUrl: undefined,
      };

      expect(() => factory.createStorageProvider(config)).toThrow(
        'MINIO configuration is incomplete',
      );
    });
  });
});