import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { MultimediaService } from './multimedia.service';
import { PrismaService } from '@/libs/prisma.service';
import { Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { TypeMultimedia } from '@prisma/client';
import { ConfigType } from '@nestjs/config';
import multimediaConfig from '../config/multimedia.config';
import { StorageProviderFactory } from '../providers/storage-provider.factory';
import { StorageProvider, StorageUploadResult, StorageDownloadResult } from '../interfaces/storage-provider.interface';
import { CreateLinkMultimediaDto } from '../dtos/multimedia.dto';
import { Readable } from 'stream';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  unlink: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('MultimediaService', () => {
  let service: MultimediaService;
  let prismaService: PrismaService;
  let logger: Logger;
  let storageProvider: StorageProvider;
  let storageProviderFactory: StorageProviderFactory;

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

  const mockMultimediaConfig: ConfigType<typeof multimediaConfig> = {
    storageProvider: 'firebase',
    bucketName: 'test-bucket',
    publicDir: '/tmp/test',
    firebaseConfig: '{}',
    minioEndpoint: 'localhost',
    minioPort: 9000,
    minioUseSSL: false,
    minioAccessKey: 'test',
    minioSecretKey: 'test',
    minioPublicUrl: 'http://localhost:9000',
  };

  const mockStorageProvider: StorageProvider = {
    uploadFile: vi.fn(),
    downloadFile: vi.fn(),
    deleteFile: vi.fn(),
  };

  const mockStorageProviderFactory = {
    createStorageProvider: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup storage provider factory to return mock storage provider
    mockStorageProviderFactory.createStorageProvider.mockReturnValue(mockStorageProvider);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultimediaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: multimediaConfig.KEY,
          useValue: mockMultimediaConfig,
        },
        {
          provide: StorageProviderFactory,
          useValue: mockStorageProviderFactory,
        },
      ],
    }).compile();

    service = module.get<MultimediaService>(MultimediaService);
    prismaService = module.get<PrismaService>(PrismaService);
    logger = module.get<Logger>(Logger);
    storageProviderFactory = module.get<StorageProviderFactory>(StorageProviderFactory);
    storageProvider = mockStorageProvider;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMultimedia', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'files',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      destination: '/tmp',
      filename: 'test.jpg',
      path: '/tmp/test.jpg',
      buffer: Buffer.from('test'),
      stream: new Readable(),
    };

    const mockUploadResult: StorageUploadResult = {
      url: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
    };

    it('should create multimedia successfully with default type', async () => {
      const mockCreatedMultimedia = { id: 'multimedia-id' };

      (mockStorageProvider.uploadFile as any).mockResolvedValue(mockUploadResult);
      mockPrismaService.multimedia.create.mockResolvedValue(mockCreatedMultimedia);
      (fs.unlink as any).mockImplementation((path: string, callback: (err?: Error) => void) => {
        callback();
      });

      const result = await service.createMultimedia([mockFile]);

      expect(mockStorageProvider.uploadFile).toHaveBeenCalledWith(
        mockFile.path,
        mockFile.filename,
        true
      );
      expect(mockPrismaService.multimedia.create).toHaveBeenCalledWith({
        data: {
          url: mockUploadResult.url,
          fileName: mockUploadResult.fileName,
          type: TypeMultimedia.IMAGE,
          description: undefined,
        },
        select: {
          id: true,
        },
      });
      expect(fs.unlink).toHaveBeenCalledWith(mockFile.path, expect.any(Function));
      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: [mockCreatedMultimedia],
      });
    });

    it('should create multimedia successfully with extraData', async () => {
      const mockCreatedMultimedia = { id: 'multimedia-id' };
      const extraData = {
        type: TypeMultimedia.VIDEO,
        description: 'Test video',
      };

      (mockStorageProvider.uploadFile as any).mockResolvedValue(mockUploadResult);
      mockPrismaService.multimedia.create.mockResolvedValue(mockCreatedMultimedia);
      (fs.unlink as any).mockImplementation((path: string, callback: (err?: Error) => void) => {
        callback();
      });

      const result = await service.createMultimedia([mockFile], extraData);

      expect(mockPrismaService.multimedia.create).toHaveBeenCalledWith({
        data: {
          url: mockUploadResult.url,
          fileName: mockUploadResult.fileName,
          type: TypeMultimedia.VIDEO,
          description: 'Test video',
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: [mockCreatedMultimedia],
      });
    });

    it('should handle multiple files successfully', async () => {
      const mockFile2: Express.Multer.File = {
        ...mockFile,
        filename: 'test2.jpg',
        path: '/tmp/test2.jpg',
      };
      const mockUploadResult2: StorageUploadResult = {
        url: 'https://example.com/test2.jpg',
        fileName: 'test2.jpg',
      };
      const mockCreatedMultimedia1 = { id: 'multimedia-id-1' };
      const mockCreatedMultimedia2 = { id: 'multimedia-id-2' };

      (mockStorageProvider.uploadFile as any)
        .mockResolvedValueOnce(mockUploadResult)
        .mockResolvedValueOnce(mockUploadResult2);
      mockPrismaService.multimedia.create
        .mockResolvedValueOnce(mockCreatedMultimedia1)
        .mockResolvedValueOnce(mockCreatedMultimedia2);
      (fs.unlink as any).mockImplementation((path: string, callback: (err?: Error) => void) => {
        callback();
      });

      const result = await service.createMultimedia([mockFile, mockFile2]);

      expect(mockStorageProvider.uploadFile).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.multimedia.create).toHaveBeenCalledTimes(2);
      expect(fs.unlink).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: [mockCreatedMultimedia1, mockCreatedMultimedia2],
      });
    });

    it('should handle storage upload error', async () => {
      const uploadError = new Error('Upload failed');
      (mockStorageProvider.uploadFile as any).mockRejectedValue(uploadError);

      await expect(service.createMultimedia([mockFile])).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createMultimedia([mockFile])).rejects.toThrow(
        'Error al guardar los archivos en el servidor'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        uploadError.message,
        uploadError.stack,
        MultimediaService.name
      );
    });

    it('should handle database creation error', async () => {
      const dbError = new Error('Database error');
      (mockStorageProvider.uploadFile as any).mockResolvedValue(mockUploadResult);
      mockPrismaService.multimedia.create.mockRejectedValue(dbError);
      (fs.unlink as any).mockImplementation((path: string, callback: (err?: Error) => void) => {
        callback();
      });

      await expect(service.createMultimedia([mockFile])).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createMultimedia([mockFile])).rejects.toThrow(
        'Error al guardar los archivos en la base de datos'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        dbError.message,
        dbError.stack,
        MultimediaService.name
      );
    });

    it('should handle file deletion error gracefully', async () => {
      const mockCreatedMultimedia = { id: 'multimedia-id' };
      const unlinkError = new Error('File deletion failed');

      (mockStorageProvider.uploadFile as any).mockResolvedValue(mockUploadResult);
      mockPrismaService.multimedia.create.mockResolvedValue(mockCreatedMultimedia);
      (fs.unlink as any).mockImplementation((path: string, callback: (err?: Error) => void) => {
        callback(unlinkError);
      });

      const result = await service.createMultimedia([mockFile]);

      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: [mockCreatedMultimedia],
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        unlinkError.message,
        unlinkError.stack,
        MultimediaService.name
      );
    });
  });

  describe('createMultimediaFromBuffer', () => {
    const mockBuffer = Buffer.from('test image data');
    const extraData = {
      fileName: 'test.webp',
      type: TypeMultimedia.IMAGE,
      description: 'Test image from buffer',
    };

    beforeEach(() => {
      vi.spyOn(service, 'createMultimedia').mockResolvedValue({
        message: 'Multimedia creado con éxito',
        data: [{ id: 'multimedia-id' }],
      });
    });

    it('should create multimedia from buffer with IMAGE type', async () => {
      const result = await service.createMultimediaFromBuffer(mockBuffer, extraData);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${mockMultimediaConfig.publicDir}/${extraData.fileName}`,
        mockBuffer
      );

      expect(service.createMultimedia).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            buffer: mockBuffer,
            originalname: extraData.fileName,
            mimetype: 'image/webp',
            fieldname: 'files',
            encoding: '7bit',
            size: 0,
            stream: expect.any(Readable),
            destination: mockMultimediaConfig.publicDir,
            filename: extraData.fileName,
            path: `${mockMultimediaConfig.publicDir}/${extraData.fileName}`,
          }),
        ],
        {
          type: TypeMultimedia.IMAGE,
          description: extraData.description,
        }
      );

      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: [{ id: 'multimedia-id' }],
      });
    });

    it('should create multimedia from buffer with VIDEO type', async () => {
      const videoExtraData = {
        ...extraData,
        type: TypeMultimedia.VIDEO,
        fileName: 'test.mp4',
      };

      await service.createMultimediaFromBuffer(mockBuffer, videoExtraData);

      expect(service.createMultimedia).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            mimetype: 'video/mp4',
            filename: videoExtraData.fileName,
          }),
        ],
        {
          type: TypeMultimedia.VIDEO,
          description: videoExtraData.description,
        }
      );
    });

    it('should create multimedia from buffer with AUDIO type', async () => {
      const audioExtraData = {
        ...extraData,
        type: TypeMultimedia.AUDIO,
        fileName: 'test.mp3',
      };

      await service.createMultimediaFromBuffer(mockBuffer, audioExtraData);

      expect(service.createMultimedia).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            mimetype: 'audio/mp3',
            filename: audioExtraData.fileName,
          }),
        ],
        {
          type: TypeMultimedia.AUDIO,
          description: audioExtraData.description,
        }
      );
    });

    it('should use default mimetype for unknown type', async () => {
      const unknownExtraData = {
        ...extraData,
        type: 'UNKNOWN' as TypeMultimedia,
      };

      await service.createMultimediaFromBuffer(mockBuffer, unknownExtraData);

      expect(service.createMultimedia).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            mimetype: 'application/octet-stream',
          }),
        ],
        expect.any(Object)
      );
    });

    it('should handle missing description', async () => {
      const extraDataWithoutDescription = {
        fileName: 'test.webp',
        type: TypeMultimedia.IMAGE,
      };

      await service.createMultimediaFromBuffer(mockBuffer, extraDataWithoutDescription);

      expect(service.createMultimedia).toHaveBeenCalledWith(
        expect.any(Array),
        {
          type: TypeMultimedia.IMAGE,
          description: undefined,
        }
      );
    });
  });

  describe('deleteMultimedia', () => {
    const multimediaId = 'multimedia-id';
    const mockMultimedia = {
      fileName: 'test.jpg',
    };

    it('should delete multimedia successfully', async () => {
      mockPrismaService.multimedia.findUniqueOrThrow.mockResolvedValue(mockMultimedia);
      (mockStorageProvider.deleteFile as any).mockResolvedValue(undefined);
      mockPrismaService.multimedia.delete.mockResolvedValue(mockMultimedia);

      const result = await service.deleteMultimedia(multimediaId);

      expect(mockPrismaService.multimedia.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: multimediaId },
        select: { fileName: true },
      });
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith(mockMultimedia.fileName);
      expect(mockPrismaService.multimedia.delete).toHaveBeenCalledWith({
        where: { id: multimediaId },
      });
      expect(result).toEqual({
        message: 'Multimedia eliminado con éxito',
      });
    });

    it('should delete multimedia without fileName', async () => {
      const multimediaWithoutFile = { fileName: null };
      mockPrismaService.multimedia.findUniqueOrThrow.mockResolvedValue(multimediaWithoutFile);
      mockPrismaService.multimedia.delete.mockResolvedValue(multimediaWithoutFile);

      const result = await service.deleteMultimedia(multimediaId);

      expect(mockStorageProvider.deleteFile).not.toHaveBeenCalled();
      expect(mockPrismaService.multimedia.delete).toHaveBeenCalledWith({
        where: { id: multimediaId },
      });
      expect(result).toEqual({
        message: 'Multimedia eliminado con éxito',
      });
    });

    it('should handle multimedia not found', async () => {
      mockPrismaService.multimedia.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

      await expect(service.deleteMultimedia(multimediaId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.deleteMultimedia(multimediaId)).rejects.toThrow(
        'Multimedia no encontrado'
      );

      expect(mockStorageProvider.deleteFile).not.toHaveBeenCalled();
      expect(mockPrismaService.multimedia.delete).not.toHaveBeenCalled();
    });

    it('should handle storage deletion error', async () => {
      const deleteError = new Error('Storage deletion failed');
      mockPrismaService.multimedia.findUniqueOrThrow.mockResolvedValue(mockMultimedia);
      (mockStorageProvider.deleteFile as any).mockRejectedValue(deleteError);

      await expect(service.deleteMultimedia(multimediaId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.deleteMultimedia(multimediaId)).rejects.toThrow(
        'Error al eliminar el archivo'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        deleteError.message,
        deleteError.stack,
        MultimediaService.name
      );
      expect(mockPrismaService.multimedia.delete).not.toHaveBeenCalled();
    });

    it('should handle database deletion error', async () => {
      const dbError = new Error('Database deletion failed');
      mockPrismaService.multimedia.findUniqueOrThrow.mockResolvedValue(mockMultimedia);
      (mockStorageProvider.deleteFile as any).mockResolvedValue(undefined);
      mockPrismaService.multimedia.delete.mockRejectedValue(dbError);

      await expect(service.deleteMultimedia(multimediaId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.deleteMultimedia(multimediaId)).rejects.toThrow(
        'Error al eliminar el archivo'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        dbError.message,
        dbError.stack,
        MultimediaService.name
      );
    });
  });

  describe('downloadMultimedia', () => {
    const multimediaId = 'multimedia-id';
    const mockMultimedia = {
      fileName: 'test.jpg',
      url: 'https://example.com/test.jpg',
    };
    const mockDownloadResult: StorageDownloadResult = {
      buffer: Buffer.from('file content'),
      name: 'test.jpg',
    };

    it('should download multimedia successfully', async () => {
      mockPrismaService.multimedia.findUniqueOrThrow.mockResolvedValue(mockMultimedia);
      (mockStorageProvider.downloadFile as any).mockResolvedValue(mockDownloadResult);

      const result = await service.downloadMultimedia(multimediaId);

      expect(mockPrismaService.multimedia.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          id: multimediaId,
          fileName: { not: null },
        },
      });
      expect(mockStorageProvider.downloadFile).toHaveBeenCalledWith(mockMultimedia.fileName);
      expect(result).toEqual({
        buffer: mockDownloadResult.buffer,
        name: mockMultimedia.url,
      });
    });

    it('should handle multimedia not found', async () => {
      mockPrismaService.multimedia.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

      await expect(service.downloadMultimedia(multimediaId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.downloadMultimedia(multimediaId)).rejects.toThrow(
        'Multimedia no encontrado o no es descargable'
      );

      expect(mockStorageProvider.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle storage download error', async () => {
      const downloadError = new Error('Download failed');
      mockPrismaService.multimedia.findUniqueOrThrow.mockResolvedValue(mockMultimedia);
      (mockStorageProvider.downloadFile as any).mockRejectedValue(downloadError);

      await expect(service.downloadMultimedia(multimediaId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.downloadMultimedia(multimediaId)).rejects.toThrow(
        'Multimedia no encontrado'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        downloadError.message,
        downloadError.stack,
        MultimediaService.name
      );
    });
  });

  describe('getMultimedia', () => {
    const multimediaId = 'multimedia-id';
    const mockMultimedia = {
      url: 'https://example.com/test.jpg',
      type: TypeMultimedia.IMAGE,
      description: 'Test image',
    };

    it('should get multimedia successfully', async () => {
      mockPrismaService.multimedia.findUniqueOrThrow.mockResolvedValue(mockMultimedia);

      const result = await service.getMultimedia(multimediaId);

      expect(mockPrismaService.multimedia.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: multimediaId },
        select: {
          url: true,
          type: true,
          description: true,
        },
      });
      expect(result).toEqual({
        data: mockMultimedia,
      });
    });

    it('should handle multimedia not found', async () => {
      mockPrismaService.multimedia.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

      await expect(service.getMultimedia(multimediaId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getMultimedia(multimediaId)).rejects.toThrow(
        'Multimedia no encontrado'
      );
    });
  });

  describe('uploadUrl', () => {
    const payload: CreateLinkMultimediaDto = {
      url: 'https://example.com/external-image.jpg',
      type: TypeMultimedia.VIDEO,
      description: 'External video',
    };

    it('should upload URL successfully', async () => {
      const mockCreatedMultimedia = { id: 'multimedia-id' };
      mockPrismaService.multimedia.create.mockResolvedValue(mockCreatedMultimedia);

      const result = await service.uploadUrl(payload);

      expect(mockPrismaService.multimedia.create).toHaveBeenCalledWith({
        data: {
          url: payload.url,
          type: payload.type,
          description: payload.description,
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: mockCreatedMultimedia,
      });
    });

    it('should upload URL with default type when not provided', async () => {
      const payloadWithoutType = {
        url: 'https://example.com/external-image.jpg',
        description: 'External image',
      } as CreateLinkMultimediaDto;
      const mockCreatedMultimedia = { id: 'multimedia-id' };
      mockPrismaService.multimedia.create.mockResolvedValue(mockCreatedMultimedia);

      const result = await service.uploadUrl(payloadWithoutType);

      expect(mockPrismaService.multimedia.create).toHaveBeenCalledWith({
        data: {
          url: payloadWithoutType.url,
          type: TypeMultimedia.IMAGE,
          description: payloadWithoutType.description,
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: mockCreatedMultimedia,
      });
    });

    it('should handle database creation error', async () => {
      const dbError = new Error('Database error');
      mockPrismaService.multimedia.create.mockRejectedValue(dbError);

      await expect(service.uploadUrl(payload)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.uploadUrl(payload)).rejects.toThrow(
        'Error al guardar los archivos en la base de datos'
      );
    });

    it('should handle payload without description', async () => {
      const payloadWithoutDescription = {
        url: 'https://example.com/external-image.jpg',
        type: TypeMultimedia.IMAGE,
      } as CreateLinkMultimediaDto;
      const mockCreatedMultimedia = { id: 'multimedia-id' };
      mockPrismaService.multimedia.create.mockResolvedValue(mockCreatedMultimedia);

      const result = await service.uploadUrl(payloadWithoutDescription);

      expect(mockPrismaService.multimedia.create).toHaveBeenCalledWith({
        data: {
          url: payloadWithoutDescription.url,
          type: TypeMultimedia.IMAGE,
          description: undefined,
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual({
        message: 'Multimedia creado con éxito',
        data: mockCreatedMultimedia,
      });
    });
  });

  describe('constructor', () => {
    it('should initialize storage provider through factory', () => {
      expect(mockStorageProviderFactory.createStorageProvider).toHaveBeenCalledWith(
        mockMultimediaConfig
      );
    });
  });
});