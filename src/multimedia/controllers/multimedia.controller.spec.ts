
import { Test, TestingModule } from '@nestjs/testing';
import { MultimediaController } from './multimedia.controller';
import { MultimediaService } from '../services/multimedia.service';
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleGuard } from '@/security/guards/roles.guard';
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
const mockMultimediaService = {
  createMultimedia: vi.fn(),
  deleteMultimedia: vi.fn(),
  downloadMultimedia: vi.fn(),
  getMultimedia: vi.fn(),
  uploadUrl: vi.fn(),
};

describe('MultimediaController', () => {
  let controller: MultimediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultimediaController],
      providers: [
        { provide: MultimediaService, useValue: mockMultimediaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MultimediaController>(MultimediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
