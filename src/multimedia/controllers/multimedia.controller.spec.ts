import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { TypeMultimedia } from '@prisma/client';
import { MultimediaController } from './multimedia.controller';
import { MultimediaService } from '../services/multimedia.service';
import {
  CreateMultimediaDto,
  CreateLinkMultimediaDto,
} from '../dtos/multimedia.dto';

describe('MultimediaController', () => {
  let controller: MultimediaController;
  let service: MultimediaService;

  // Mock service methods
  const mockMultimediaService = {
    createMultimedia: vi.fn(),
    deleteMultimedia: vi.fn(),
    downloadMultimedia: vi.fn(),
    getMultimedia: vi.fn(),
    uploadUrl: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultimediaController],
      providers: [
        {
          provide: MultimediaService,
          useValue: mockMultimediaService,
        },
      ],
    }).compile();

    controller = module.get<MultimediaController>(MultimediaController);
    service = module.get<MultimediaService>(MultimediaService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createMultimedia', () => {
    const mockFiles: Express.Multer.File[] = [
      {
        fieldname: 'files',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image content'),
        size: 1024,
        destination: '/tmp',
        filename: 'test-image-123.jpg',
        path: '/tmp/test-image-123.jpg',
        stream: {} as any,
      },
      {
        fieldname: 'files',
        originalname: 'test-video.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        buffer: Buffer.from('test video content'),
        size: 2048,
        destination: '/tmp',
        filename: 'test-video-456.mp4',
        path: '/tmp/test-video-456.mp4',
        stream: {} as any,
      },
    ];

    const createMultimediaDto: CreateMultimediaDto = {
      type: TypeMultimedia.IMAGE,
      description: 'Test multimedia description',
      files: mockFiles,
    };

    it('should create multimedia successfully with files and data', async () => {
      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: [{ id: 'multimedia-id-1' }, { id: 'multimedia-id-2' }],
      };

      mockMultimediaService.createMultimedia.mockResolvedValue(expectedResult);

      const result = await controller.createMultimedia(
        mockFiles,
        createMultimediaDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.createMultimedia).toHaveBeenCalledWith(
        mockFiles,
        createMultimediaDto,
      );
      expect(service.createMultimedia).toHaveBeenCalledTimes(1);
    });

    it('should handle single file upload', async () => {
      const singleFile = [mockFiles[0]];
      const singleFileDto: CreateMultimediaDto = {
        type: TypeMultimedia.VIDEO,
        description: 'Single video file',
        files: singleFile,
      };

      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: [{ id: 'multimedia-id-1' }],
      };

      mockMultimediaService.createMultimedia.mockResolvedValue(expectedResult);

      const result = await controller.createMultimedia(
        singleFile,
        singleFileDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.createMultimedia).toHaveBeenCalledWith(
        singleFile,
        singleFileDto,
      );
    });

    it('should handle empty files array', async () => {
      const emptyFiles: Express.Multer.File[] = [];
      const emptyFilesDto: CreateMultimediaDto = {
        type: TypeMultimedia.AUDIO,
        description: 'No files provided',
        files: emptyFiles,
      };

      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: [],
      };

      mockMultimediaService.createMultimedia.mockResolvedValue(expectedResult);

      const result = await controller.createMultimedia(
        emptyFiles,
        emptyFilesDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.createMultimedia).toHaveBeenCalledWith(
        emptyFiles,
        emptyFilesDto,
      );
    });

    it('should handle service errors during file creation', async () => {
      const error = new BadRequestException(
        'Error al guardar los archivos en el servidor',
      );
      mockMultimediaService.createMultimedia.mockRejectedValue(error);

      await expect(
        controller.createMultimedia(mockFiles, createMultimediaDto),
      ).rejects.toThrow(BadRequestException);

      expect(service.createMultimedia).toHaveBeenCalledWith(
        mockFiles,
        createMultimediaDto,
      );
    });

    it('should handle different multimedia types', async () => {
      const videoDto: CreateMultimediaDto = {
        type: TypeMultimedia.VIDEO,
        description: 'Video file',
        files: [mockFiles[1]],
      };

      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: [{ id: 'video-id-1' }],
      };

      mockMultimediaService.createMultimedia.mockResolvedValue(expectedResult);

      const result = await controller.createMultimedia(
        [mockFiles[1]],
        videoDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.createMultimedia).toHaveBeenCalledWith(
        [mockFiles[1]],
        videoDto,
      );
    });
  });

  describe('deleteMultimedia', () => {
    const multimediaId = 'test-multimedia-id';

    it('should delete multimedia successfully', async () => {
      const expectedResult = { message: 'Multimedia eliminado con éxito' };
      mockMultimediaService.deleteMultimedia.mockResolvedValue(expectedResult);

      const result = await controller.deleteMultimedia(multimediaId);

      expect(result).toEqual(expectedResult);
      expect(service.deleteMultimedia).toHaveBeenCalledWith(multimediaId);
      expect(service.deleteMultimedia).toHaveBeenCalledTimes(1);
    });

    it('should handle not found error when deleting non-existent multimedia', async () => {
      const error = new NotFoundException('Multimedia no encontrado');
      mockMultimediaService.deleteMultimedia.mockRejectedValue(error);

      await expect(controller.deleteMultimedia(multimediaId)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.deleteMultimedia).toHaveBeenCalledWith(multimediaId);
    });

    it('should handle service errors during deletion', async () => {
      const error = new BadRequestException('Error al eliminar el archivo');
      mockMultimediaService.deleteMultimedia.mockRejectedValue(error);

      await expect(controller.deleteMultimedia(multimediaId)).rejects.toThrow(
        BadRequestException,
      );

      expect(service.deleteMultimedia).toHaveBeenCalledWith(multimediaId);
    });

    it('should handle empty or invalid ID', async () => {
      const invalidId = '';
      const error = new NotFoundException('Multimedia no encontrado');
      mockMultimediaService.deleteMultimedia.mockRejectedValue(error);

      await expect(controller.deleteMultimedia(invalidId)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.deleteMultimedia).toHaveBeenCalledWith(invalidId);
    });
  });

  describe('getMultimedia', () => {
    const multimediaId = 'test-multimedia-id';

    it('should download multimedia file successfully', async () => {
      const mockFileData = {
        buffer: Buffer.from('test file content'),
        name: 'test-file.jpg',
      };

      const mockResponse = {
        set: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      mockMultimediaService.downloadMultimedia.mockResolvedValue(mockFileData);

      await controller.getMultimedia(multimediaId, mockResponse);

      expect(service.downloadMultimedia).toHaveBeenCalledWith(multimediaId);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename= ${mockFileData.name}`,
        'x-processed-filename': `${mockFileData.name}`,
      });
      expect(mockResponse.send).toHaveBeenCalledWith(mockFileData.buffer);
    });

    it('should handle different file types with proper headers', async () => {
      const mockPdfData = {
        buffer: Buffer.from('PDF content'),
        name: 'document.pdf',
      };

      const mockResponse = {
        set: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      mockMultimediaService.downloadMultimedia.mockResolvedValue(mockPdfData);

      await controller.getMultimedia(multimediaId, mockResponse);

      expect(service.downloadMultimedia).toHaveBeenCalledWith(multimediaId);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename= ${mockPdfData.name}`,
        'x-processed-filename': `${mockPdfData.name}`,
      });
      expect(mockResponse.send).toHaveBeenCalledWith(mockPdfData.buffer);
    });

    it('should handle not found error when downloading non-existent multimedia', async () => {
      const error = new NotFoundException('Multimedia no encontrado');
      mockMultimediaService.downloadMultimedia.mockRejectedValue(error);

      const mockResponse = {
        set: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      await expect(
        controller.getMultimedia(multimediaId, mockResponse),
      ).rejects.toThrow(NotFoundException);

      expect(service.downloadMultimedia).toHaveBeenCalledWith(multimediaId);
      expect(mockResponse.set).not.toHaveBeenCalled();
      expect(mockResponse.send).not.toHaveBeenCalled();
    });

    it('should handle service errors during file download', async () => {
      const error = new BadRequestException('Error al descargar el archivo');
      mockMultimediaService.downloadMultimedia.mockRejectedValue(error);

      const mockResponse = {
        set: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      await expect(
        controller.getMultimedia(multimediaId, mockResponse),
      ).rejects.toThrow(BadRequestException);

      expect(service.downloadMultimedia).toHaveBeenCalledWith(multimediaId);
      expect(mockResponse.set).not.toHaveBeenCalled();
      expect(mockResponse.send).not.toHaveBeenCalled();
    });

    it('should handle files with special characters in name', async () => {
      const mockFileData = {
        buffer: Buffer.from('file content'),
        name: 'archivo con espacios y ñ.jpg',
      };

      const mockResponse = {
        set: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      mockMultimediaService.downloadMultimedia.mockResolvedValue(mockFileData);

      await controller.getMultimedia(multimediaId, mockResponse);

      expect(service.downloadMultimedia).toHaveBeenCalledWith(multimediaId);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename= ${mockFileData.name}`,
        'x-processed-filename': `${mockFileData.name}`,
      });
      expect(mockResponse.send).toHaveBeenCalledWith(mockFileData.buffer);
    });
  });

  describe('getMultimediaUrl', () => {
    const multimediaId = 'test-multimedia-id';

    it('should get multimedia URL data successfully', async () => {
      const expectedResult = {
        data: {
          url: 'https://example.com/image.jpg',
          type: TypeMultimedia.IMAGE,
          description: 'Test image description',
        },
      };

      mockMultimediaService.getMultimedia.mockResolvedValue(expectedResult);

      const result = await controller.getMultimediaUrl(multimediaId);

      expect(result).toEqual(expectedResult);
      expect(service.getMultimedia).toHaveBeenCalledWith(multimediaId);
      expect(service.getMultimedia).toHaveBeenCalledTimes(1);
    });

    it('should handle different multimedia types in URL data', async () => {
      const videoResult = {
        data: {
          url: 'https://example.com/video.mp4',
          type: TypeMultimedia.VIDEO,
          description: 'Test video description',
        },
      };

      mockMultimediaService.getMultimedia.mockResolvedValue(videoResult);

      const result = await controller.getMultimediaUrl(multimediaId);

      expect(result).toEqual(videoResult);
      expect(service.getMultimedia).toHaveBeenCalledWith(multimediaId);
    });

    it('should handle multimedia without description', async () => {
      const resultWithoutDescription = {
        data: {
          url: 'https://example.com/audio.mp3',
          type: TypeMultimedia.AUDIO,
          description: null,
        },
      };

      mockMultimediaService.getMultimedia.mockResolvedValue(
        resultWithoutDescription,
      );

      const result = await controller.getMultimediaUrl(multimediaId);

      expect(result).toEqual(resultWithoutDescription);
      expect(service.getMultimedia).toHaveBeenCalledWith(multimediaId);
    });

    it('should handle not found error when getting multimedia URL', async () => {
      const error = new NotFoundException('Multimedia no encontrado');
      mockMultimediaService.getMultimedia.mockRejectedValue(error);

      await expect(controller.getMultimediaUrl(multimediaId)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.getMultimedia).toHaveBeenCalledWith(multimediaId);
    });

    it('should handle service errors during URL retrieval', async () => {
      const error = new BadRequestException('Error al obtener el multimedia');
      mockMultimediaService.getMultimedia.mockRejectedValue(error);

      await expect(controller.getMultimediaUrl(multimediaId)).rejects.toThrow(
        BadRequestException,
      );

      expect(service.getMultimedia).toHaveBeenCalledWith(multimediaId);
    });
  });

  describe('createLinkMultimedia', () => {
    const createLinkMultimediaDto: CreateLinkMultimediaDto = {
      url: 'https://example.com/external-image.jpg',
      type: TypeMultimedia.IMAGE,
      description: 'External image link',
    };

    it('should create link multimedia successfully', async () => {
      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: { id: 'link-multimedia-id' },
      };

      mockMultimediaService.uploadUrl.mockResolvedValue(expectedResult);

      const result = await controller.createLinkMultimedia(
        createLinkMultimediaDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.uploadUrl).toHaveBeenCalledWith(createLinkMultimediaDto);
      expect(service.uploadUrl).toHaveBeenCalledTimes(1);
    });

    it('should handle different multimedia types for links', async () => {
      const videoLinkDto: CreateLinkMultimediaDto = {
        url: 'https://example.com/video.mp4',
        type: TypeMultimedia.VIDEO,
        description: 'External video link',
      };

      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: { id: 'video-link-id' },
      };

      mockMultimediaService.uploadUrl.mockResolvedValue(expectedResult);

      const result = await controller.createLinkMultimedia(videoLinkDto);

      expect(result).toEqual(expectedResult);
      expect(service.uploadUrl).toHaveBeenCalledWith(videoLinkDto);
    });

    it('should handle link multimedia without description', async () => {
      const linkWithoutDescription: CreateLinkMultimediaDto = {
        url: 'https://example.com/audio.mp3',
        type: TypeMultimedia.AUDIO,
        description: undefined,
      };

      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: { id: 'audio-link-id' },
      };

      mockMultimediaService.uploadUrl.mockResolvedValue(expectedResult);

      const result = await controller.createLinkMultimedia(
        linkWithoutDescription,
      );

      expect(result).toEqual(expectedResult);
      expect(service.uploadUrl).toHaveBeenCalledWith(linkWithoutDescription);
    });

    it('should handle service errors during link creation', async () => {
      const error = new BadRequestException(
        'Error al guardar los archivos en la base de datos',
      );
      mockMultimediaService.uploadUrl.mockRejectedValue(error);

      await expect(
        controller.createLinkMultimedia(createLinkMultimediaDto),
      ).rejects.toThrow(BadRequestException);

      expect(service.uploadUrl).toHaveBeenCalledWith(createLinkMultimediaDto);
    });

    it('should handle invalid URL format', async () => {
      const invalidUrlDto: CreateLinkMultimediaDto = {
        url: 'invalid-url',
        type: TypeMultimedia.IMAGE,
        description: 'Invalid URL test',
      };

      // The validation should happen at the DTO level, but we test the service call
      const error = new BadRequestException('URL inválida');
      mockMultimediaService.uploadUrl.mockRejectedValue(error);

      await expect(
        controller.createLinkMultimedia(invalidUrlDto),
      ).rejects.toThrow(BadRequestException);

      expect(service.uploadUrl).toHaveBeenCalledWith(invalidUrlDto);
    });

    it('should handle long descriptions', async () => {
      const longDescriptionDto: CreateLinkMultimediaDto = {
        url: 'https://example.com/image.jpg',
        type: TypeMultimedia.IMAGE,
        description: 'A'.repeat(1000), // Very long description
      };

      const expectedResult = {
        message: 'Multimedia creado con éxito',
        data: { id: 'long-desc-id' },
      };

      mockMultimediaService.uploadUrl.mockResolvedValue(expectedResult);

      const result = await controller.createLinkMultimedia(longDescriptionDto);

      expect(result).toEqual(expectedResult);
      expect(service.uploadUrl).toHaveBeenCalledWith(longDescriptionDto);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected service errors in createMultimedia', async () => {
      const files: Express.Multer.File[] = [];
      const dto: CreateMultimediaDto = {
        type: TypeMultimedia.IMAGE,
        description: 'Test',
        files: [],
      };

      const unexpectedError = new Error('Unexpected error');
      mockMultimediaService.createMultimedia.mockRejectedValue(unexpectedError);

      await expect(controller.createMultimedia(files, dto)).rejects.toThrow(
        'Unexpected error',
      );
    });

    it('should handle unexpected service errors in deleteMultimedia', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockMultimediaService.deleteMultimedia.mockRejectedValue(unexpectedError);

      await expect(controller.deleteMultimedia('test-id')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle unexpected service errors in getMultimedia', async () => {
      const mockResponse = {
        set: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      const unexpectedError = new Error('File system error');
      mockMultimediaService.downloadMultimedia.mockRejectedValue(
        unexpectedError,
      );

      await expect(
        controller.getMultimedia('test-id', mockResponse),
      ).rejects.toThrow('File system error');
    });

    it('should handle unexpected service errors in getMultimediaUrl', async () => {
      const unexpectedError = new Error('Network error');
      mockMultimediaService.getMultimedia.mockRejectedValue(unexpectedError);

      await expect(controller.getMultimediaUrl('test-id')).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle unexpected service errors in createLinkMultimedia', async () => {
      const dto: CreateLinkMultimediaDto = {
        url: 'https://example.com/test.jpg',
        type: TypeMultimedia.IMAGE,
        description: 'Test',
      };

      const unexpectedError = new Error('External service unavailable');
      mockMultimediaService.uploadUrl.mockRejectedValue(unexpectedError);

      await expect(controller.createLinkMultimedia(dto)).rejects.toThrow(
        'External service unavailable',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined parameters gracefully', async () => {
      // Testing with null files array
      const nullDto: CreateMultimediaDto = {
        type: TypeMultimedia.IMAGE,
        description: null,
        files: null as any,
      };

      mockMultimediaService.createMultimedia.mockResolvedValue({
        message: 'Multimedia creado con éxito',
        data: [],
      });

      const result = await controller.createMultimedia(null as any, nullDto);

      expect(service.createMultimedia).toHaveBeenCalledWith(null, nullDto);
    });

    it('should handle very large file buffers', async () => {
      const largeFile: Express.Multer.File = {
        fieldname: 'files',
        originalname: 'large-file.zip',
        encoding: '7bit',
        mimetype: 'application/zip',
        buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB buffer
        size: 10 * 1024 * 1024,
        destination: '/tmp',
        filename: 'large-file.zip',
        path: '/tmp/large-file.zip',
        stream: {} as any,
      };

      const dto: CreateMultimediaDto = {
        type: TypeMultimedia.IMAGE,
        description: 'Large file test',
        files: [largeFile],
      };

      mockMultimediaService.createMultimedia.mockResolvedValue({
        message: 'Multimedia creado con éxito',
        data: [{ id: 'large-file-id' }],
      });

      const result = await controller.createMultimedia([largeFile], dto);

      expect(result.data).toHaveLength(1);
      expect(service.createMultimedia).toHaveBeenCalledWith([largeFile], dto);
    });

    it('should handle special characters in multimedia IDs', async () => {
      const specialId = 'test-id-with-special-chars-ñáéíóú_123';

      mockMultimediaService.deleteMultimedia.mockResolvedValue({
        message: 'Multimedia eliminado con éxito',
      });

      const result = await controller.deleteMultimedia(specialId);

      expect(result.message).toBe('Multimedia eliminado con éxito');
      expect(service.deleteMultimedia).toHaveBeenCalledWith(specialId);
    });
  });
});
