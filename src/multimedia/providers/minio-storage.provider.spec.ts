import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MinioStorageProvider } from './minio-storage.provider';
import { Client as MinioClient } from 'minio';
import * as fs from 'fs';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('minio', () => {
  const mockMinioClient = {
    bucketExists: vi.fn(),
    makeBucket: vi.fn(),
    putObject: vi.fn(),
    getObject: vi.fn(),
    removeObject: vi.fn(),
    setBucketPolicy: vi.fn(),
  };
  return { Client: vi.fn(() => mockMinioClient) };
});

vi.mock('fs', () => ({
  statSync: vi.fn(),
  createReadStream: vi.fn(),
}));

describe('MinioStorageProvider', () => {
  let provider: MinioStorageProvider;
  let minioClient: any;

  const config = {
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    bucketName: 'test-bucket',
    publicUrl: 'http://localhost:9000',
  };

  beforeEach(() => {
    minioClient = new MinioClient(config);
    provider = new MinioStorageProvider(
      config.endPoint,
      config.port,
      config.useSSL,
      config.accessKey,
      config.secretKey,
      config.bucketName,
      config.publicUrl,
    );
    vi.spyOn(minioClient, 'bucketExists').mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file and return the public url', async () => {
      const filePath = 'test/file.txt';
      const fileName = 'file.txt';

      vi.spyOn(fs, 'statSync').mockReturnValue({ size: 100 } as any);
      vi.spyOn(fs, 'createReadStream').mockReturnValue({} as any);
      vi.spyOn(minioClient, 'putObject').mockResolvedValue({} as any);
      vi.spyOn(minioClient, 'setBucketPolicy').mockResolvedValue(undefined);

      const result = await provider.uploadFile(filePath, fileName);

      expect(result).toEqual({
        url: `${config.publicUrl}/${config.bucketName}/${fileName}`,
        fileName,
      });
    });

    it('should throw a BadRequestException if upload fails', async () => {
      const filePath = 'test/file.txt';
      const fileName = 'file.txt';

      vi.spyOn(fs, 'statSync').mockReturnValue({ size: 100 } as any);
      vi.spyOn(fs, 'createReadStream').mockReturnValue({} as any);
      vi.spyOn(minioClient, 'putObject').mockRejectedValue(new Error('Upload failed'));

      await expect(provider.uploadFile(filePath, fileName)).rejects.toThrow(BadRequestException);
    });
  });

  describe('downloadFile', () => {
    it('should download a file and return the buffer', async () => {
      const fileName = 'file.txt';
      const buffer = Buffer.from('test');
      const stream = {
        on: (event, callback) => {
          if (event === 'data') {
            callback(buffer);
          }
          if (event === 'end') {
            callback();
          }
        },
      };

      vi.spyOn(minioClient, 'getObject').mockResolvedValue(stream as any);

      const result = await provider.downloadFile(fileName);

      expect(result).toEqual({
        buffer,
        name: fileName,
      });
    });

    it('should throw a NotFoundException if download fails', async () => {
      const fileName = 'file.txt';

      vi.spyOn(minioClient, 'getObject').mockRejectedValue(new Error('Download failed'));

      await expect(provider.downloadFile(fileName)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const fileName = 'file.txt';

      const removeObjectMock = vi.spyOn(minioClient, 'removeObject').mockResolvedValue(undefined);

      await provider.deleteFile(fileName);

      expect(removeObjectMock).toHaveBeenCalledWith(config.bucketName, fileName);
    });

    it('should throw a BadRequestException if delete fails', async () => {
      const fileName = 'file.txt';

      vi.spyOn(minioClient, 'removeObject').mockRejectedValue(new Error('Delete failed'));

      await expect(provider.deleteFile(fileName)).rejects.toThrow(BadRequestException);
    });
  });
});
