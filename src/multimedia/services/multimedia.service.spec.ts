
import { Test, TestingModule } from '@nestjs/testing';
import { MultimediaService } from './multimedia.service';
import { PrismaService } from '@/libs/prisma.service';
import { Logger } from '@nestjs/common';
import multimediaConfig from '../config/multimedia.config';
import { StorageProviderFactory } from '../providers/storage-provider.factory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup environment variables for multimedia configuration
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.BUCKET_NAME = 'test-bucket';
  process.env.STORAGE_PROVIDER = 'firebase';
  process.env.PUBLIC_DIR = '/tmp/public';
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'test' });
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock dependencies
const mockPrismaService = {
  multimedia: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    delete: vi.fn(),
  },
};

const mockLogger = {
  error: vi.fn(),
};

const mockStorageProvider = {
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  downloadFile: vi.fn(),
};

const mockStorageProviderFactory = {
  createStorageProvider: vi.fn().mockReturnValue(mockStorageProvider),
};

const mockMultimediaConfig = {
  publicDir: '/tmp/public',
};

describe('MultimediaService', () => {
  let service: MultimediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultimediaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Logger, useValue: mockLogger },
        { provide: multimediaConfig.KEY, useValue: mockMultimediaConfig },
        { provide: StorageProviderFactory, useValue: mockStorageProviderFactory },
      ],
    }).compile();

    service = module.get<MultimediaService>(MultimediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
