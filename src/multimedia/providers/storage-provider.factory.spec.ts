import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageProviderFactory } from './storage-provider.factory';
import { FirebaseStorageProvider } from './firebase-storage.provider';
import { MinioStorageProvider } from './minio-storage.provider';
import { ConfigType } from '@nestjs/config';
import multimediaConfig from '../config/multimedia.config';

// Mock the providers to prevent their constructors from being called
vi.mock('./firebase-storage.provider');
vi.mock('./minio-storage.provider');

describe('StorageProviderFactory', () => {
  let factory: StorageProviderFactory;

  beforeEach(() => {
    factory = new StorageProviderFactory();
    vi.clearAllMocks(); // Clear mocks before each test
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('createStorageProvider', () => {
    it('should create a FirebaseStorageProvider', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: 'firebase',
        bucketName: 'test-bucket',
        firebaseConfig: '{}',
      } as any;

      const provider = factory.createStorageProvider(config);
      expect(FirebaseStorageProvider).toHaveBeenCalledWith(
        config.bucketName,
        config.firebaseConfig,
      );
      expect(provider).toBeInstanceOf(FirebaseStorageProvider);
    });

    it('should throw an error if Firebase config is missing', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: 'firebase',
        bucketName: 'test-bucket',
      } as any;

      expect(() => factory.createStorageProvider(config)).toThrow(
        'Firebase configuration is required when using Firebase storage',
      );
    });

    it('should create a MinioStorageProvider', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: 'minio',
        bucketName: 'test-bucket',
        minioEndpoint: 'localhost',
        minioPort: 9000,
        minioAccessKey: 'minio',
        minioSecretKey: 'minio123',
        minioUseSSL: false,
        minioPublicUrl: 'http://localhost:9000',
      } as any;

      const provider = factory.createStorageProvider(config);
      expect(MinioStorageProvider).toHaveBeenCalledWith(
        config.minioEndpoint,
        config.minioPort,
        config.minioUseSSL,
        config.minioAccessKey,
        config.minioSecretKey,
        config.bucketName,
        config.minioPublicUrl,
      );
      expect(provider).toBeInstanceOf(MinioStorageProvider);
    });

    it('should throw an error if Minio config is incomplete', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: 'minio',
        bucketName: 'test-bucket',
      } as any;

      expect(() => factory.createStorageProvider(config)).toThrow(
        'MINIO configuration is incomplete',
      );
    });

    it('should throw an error for unsupported providers', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: 'unsupported',
      } as any;

      expect(() => factory.createStorageProvider(config)).toThrow(
        'Unsupported storage provider: unsupported',
      );
    });
  });
});
