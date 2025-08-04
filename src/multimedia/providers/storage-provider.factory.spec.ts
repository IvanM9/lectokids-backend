import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageProviderFactory } from './storage-provider.factory';
import { FirebaseStorageProvider } from './firebase-storage.provider';
import { MinioStorageProvider } from './minio-storage.provider';
import { ConfigType } from '@nestjs/config';
import multimediaConfig from '../config/multimedia.config';
import firebaseConfig from '../config/firebase.config';
import minioConfig from '../config/minio.config';
import { StorageProviderEnum } from '../enums/storage-provider.enum';

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
        storageProvider: StorageProviderEnum.FIREBASE,
        bucketName: 'test-bucket',
      } as any;

      const firebaseEnv: ConfigType<typeof firebaseConfig> = {
        firebaseConfig: '{}',
      } as any;

      const minioEnv: ConfigType<typeof minioConfig> = {} as any;

      const provider = factory.createStorageProvider(
        config,
        firebaseEnv,
        minioEnv,
      );
      expect(FirebaseStorageProvider).toHaveBeenCalledWith(
        config.bucketName,
        firebaseEnv.firebaseConfig,
      );
      expect(provider).toBeInstanceOf(FirebaseStorageProvider);
    });

    it('should throw an error if Firebase config is missing', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: StorageProviderEnum.FIREBASE,
        bucketName: 'test-bucket',
      } as any;

      const firebaseEnv: ConfigType<typeof firebaseConfig> = {} as any;

      const minioEnv: ConfigType<typeof minioConfig> = {} as any;

      expect(() =>
        factory.createStorageProvider(config, firebaseEnv, minioEnv),
      ).toThrow(
        'Firebase configuration is required when using Firebase storage',
      );
    });

    it('should create a MinioStorageProvider', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: StorageProviderEnum.MINIO,
        bucketName: 'test-bucket',
      } as any;

      const firebaseEnv: ConfigType<typeof firebaseConfig> = {
        firebaseConfig: '{}',
      } as any;

      const minioEnv: ConfigType<typeof minioConfig> = {
        endPoint: 'localhost',
        port: 9000,
        accessKey: 'minio',
        secretKey: 'minio123',
        publicUrl: 'http://localhost:9000',
        useSSL: false,
      } as any;

      console.log(minioEnv);

      const provider = factory.createStorageProvider(
        config,
        firebaseEnv,
        minioEnv,
      );
      expect(MinioStorageProvider).toHaveBeenCalledWith(
        minioEnv.endPoint,
        minioEnv.port,
        minioEnv.useSSL,
        minioEnv.accessKey,
        minioEnv.secretKey,
        config.bucketName,
        minioEnv.publicUrl,
      );
      expect(provider).toBeInstanceOf(MinioStorageProvider);
    });

    it('should throw an error if Minio config is incomplete', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: StorageProviderEnum.MINIO,
        bucketName: 'test-bucket',
      } as any;

      const firebaseEnv: ConfigType<typeof firebaseConfig> = {
        firebaseConfig: '{}',
      } as any;

      const minioEnv: ConfigType<typeof minioConfig> = {
        MINIO_ENDPOINT: 'localhost',
        port: 9000,
        MINIO_ACCESS_KEY: 'minio',
        MINIO_SECRET_KEY: 'minio123',
        MINIO_PUBLIC_URL: 'http://localhost:9000',
      } as any;

      expect(() =>
        factory.createStorageProvider(config, firebaseEnv, minioEnv),
      ).toThrow('MINIO configuration is incomplete');
    });

    it('should throw an error for unsupported providers', () => {
      const config: ConfigType<typeof multimediaConfig> = {
        storageProvider: 'unsupported',
      } as any;

      const firebaseEnv: ConfigType<typeof firebaseConfig> = {
        firebaseConfig: '{}',
      } as any;

      const minioEnv: ConfigType<typeof minioConfig> = {} as any;

      expect(() =>
        factory.createStorageProvider(config, firebaseEnv, minioEnv),
      ).toThrow('Unsupported storage provider: unsupported');
    });
  });
});
