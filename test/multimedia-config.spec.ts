import { multimediaSchema } from '../src/multimedia/config/multimedia.validation';

describe('MultimediaConfiguration', () => {
  describe('Firebase Configuration', () => {
    it('should validate Firebase configuration correctly', () => {
      const firebaseConfig = {
        STORAGE_PROVIDER: 'firebase',
        BUCKET_NAME: 'test-bucket',
        FIREBASE_CONFIG: '{"test": "config"}',
        PUBLIC_DIR: './src/public',
      };

      const result = multimediaSchema.safeParse(firebaseConfig);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.STORAGE_PROVIDER).toBe('firebase');
        expect(result.data.BUCKET_NAME).toBe('test-bucket');
        expect(result.data.FIREBASE_CONFIG).toBe('{"test": "config"}');
      }
    });

    it('should fail when Firebase config is missing', () => {
      const firebaseConfig = {
        STORAGE_PROVIDER: 'firebase',
        BUCKET_NAME: 'test-bucket',
        PUBLIC_DIR: './src/public',
        // Missing FIREBASE_CONFIG
      };

      const result = multimediaSchema.safeParse(firebaseConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('MINIO Configuration', () => {
    it('should validate MINIO configuration correctly', () => {
      const minioConfig = {
        STORAGE_PROVIDER: 'minio',
        BUCKET_NAME: 'test-bucket',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'test-key',
        MINIO_SECRET_KEY: 'test-secret',
        PUBLIC_DIR: './src/public',
      };

      const result = multimediaSchema.safeParse(minioConfig);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.STORAGE_PROVIDER).toBe('minio');
        expect(result.data.BUCKET_NAME).toBe('test-bucket');
        expect(result.data.MINIO_ENDPOINT).toBe('localhost');
        expect(result.data.MINIO_PORT).toBe(9000);
        expect(result.data.MINIO_USE_SSL).toBe(false);
      }
    });

    it('should fail when MINIO config is incomplete', () => {
      const minioConfig = {
        STORAGE_PROVIDER: 'minio',
        BUCKET_NAME: 'test-bucket',
        MINIO_ENDPOINT: 'localhost',
        // Missing other MINIO configs
        PUBLIC_DIR: './src/public',
      };

      const result = multimediaSchema.safeParse(minioConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should use firebase as default storage provider', () => {
      const config = {
        BUCKET_NAME: 'test-bucket',
        FIREBASE_CONFIG: '{"test": "config"}',
      };

      const result = multimediaSchema.safeParse(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.STORAGE_PROVIDER).toBe('firebase');
        expect(result.data.PUBLIC_DIR).toBe('./src/public');
      }
    });
  });
});