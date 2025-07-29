import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebaseStorageProvider } from './firebase-storage.provider';
import * as firebase from 'firebase-admin';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock implementation for firebase-admin
const mockUpload = vi.fn();
const mockDownload = vi.fn();
const mockDelete = vi.fn();
const mockFile = vi.fn(() => ({
  download: mockDownload,
  delete: mockDelete,
}));
const mockBucket = vi.fn(() => ({
  upload: mockUpload,
  file: mockFile,
}));

vi.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: vi.fn(),
  credential: {
    cert: vi.fn(),
  },
  storage: vi.fn(() => ({
    bucket: mockBucket,
  })),
}));

describe('FirebaseStorageProvider', () => {
  let provider: FirebaseStorageProvider;
  const bucketName = 'test-bucket';
  const firebaseConfig = '{}';

  beforeEach(() => {
    // Initialize provider before each test
    provider = new FirebaseStorageProvider(bucketName, firebaseConfig);
  });

  afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file and return the public url', async () => {
      const filePath = 'test/file.txt';
      const fileName = 'file.txt';
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

      // Configure the mock to resolve successfully
      mockUpload.mockResolvedValueOnce([{ publicUrl: () => publicUrl }] as any);

      const result = await provider.uploadFile(filePath, fileName);

      expect(mockBucket).toHaveBeenCalledWith(bucketName);
      expect(mockUpload).toHaveBeenCalledWith(filePath, {
        destination: fileName,
        public: true,
      });
      expect(result).toEqual({
        url: publicUrl,
        fileName,
      });
    });

    it('should throw a BadRequestException if upload fails', async () => {
      const filePath = 'test/file.txt';
      const fileName = 'file.txt';

      // Configure the mock to reject
      mockUpload.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(provider.uploadFile(filePath, fileName)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('downloadFile', () => {
    it('should download a file and return the buffer', async () => {
      const fileName = 'file.txt';
      const buffer = Buffer.from('test');

      // Configure the mock to resolve successfully
      mockDownload.mockResolvedValueOnce([buffer]);

      const result = await provider.downloadFile(fileName);

      expect(mockFile).toHaveBeenCalledWith(fileName);
      expect(mockDownload).toHaveBeenCalled();
      expect(result).toEqual({
        buffer,
        name: fileName,
      });
    });

    it('should throw a NotFoundException if download fails', async () => {
      const fileName = 'file.txt';

      // Configure the mock to reject
      mockDownload.mockRejectedValueOnce(new Error('Download failed'));

      await expect(provider.downloadFile(fileName)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const fileName = 'file.txt';

      // Configure the mock to resolve successfully
      mockDelete.mockResolvedValueOnce(undefined);

      await provider.deleteFile(fileName);

      expect(mockFile).toHaveBeenCalledWith(fileName);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw a BadRequestException if delete fails', async () => {
      const fileName = 'file.txt';

      // Configure the mock to reject
      mockDelete.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(provider.deleteFile(fileName)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
