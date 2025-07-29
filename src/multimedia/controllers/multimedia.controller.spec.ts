
import { Test, TestingModule } from '@nestjs/testing';
import { MultimediaController } from './multimedia.controller';
import { MultimediaService } from '../services/multimedia.service';
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleGuard } from '@/security/guards/roles.guard';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
