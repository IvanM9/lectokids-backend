import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/libs/prisma.service';
import jwtConfig from '../config/jwt.config';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { LoginDto, DetailLoginDto } from './dtos/LoginDto';
import { BadRequestException } from '@nestjs/common';
import { RoleEnum } from '../enums/role.enum';
import { compare } from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService - Email Login', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUniqueOrThrow: jest.fn(),
    },
    teacher: {
      findFirstOrThrow: jest.fn(),
    },
    student: {
      findFirstOrThrow: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockJwtConfig = {
    secret: 'test-secret',
    expiresIn: 3600,
  };

  const mockRefreshJwtConfig = {
    secret: 'test-refresh-secret',
    expiresIn: 7200,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
        {
          provide: refreshJwtConfig.KEY,
          useValue: mockRefreshJwtConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login with email', () => {
    it('should login successfully with email', async () => {
      const loginDto: LoginDto = {
        user: 'john.doe@example.com',
        password: 'password123',
      };

      const detailDto: DetailLoginDto = {
        ipAddress: '127.0.0.1',
        device: 'Chrome',
        location: 'Ecuador',
      };

      const mockUser = {
        id: 'user-id',
        user: 'johndoe',
        email: 'john.doe@example.com',
        password: 'hashedPassword',
        role: RoleEnum.TEACHER,
        status: true,
      };

      const mockSession = {
        id: 'session-id',
        user: { role: RoleEnum.TEACHER },
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaService.teacher.findFirstOrThrow.mockResolvedValue({ id: 'teacher-id' });
      
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockCnx = {
          session: {
            create: jest.fn().mockResolvedValue(mockSession),
            update: jest.fn(),
          },
        };
        return callback(mockCnx);
      });

      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto, detailDto);

      expect(mockPrismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
        select: {
          id: true,
          user: true,
          email: true,
          password: true,
          role: true,
          status: true,
        },
      });

      expect(result).toEqual({
        token: 'access-token',
        refreshToken: 'refresh-token',
        role: RoleEnum.TEACHER,
      });
    });

    it('should login successfully with username', async () => {
      const loginDto: LoginDto = {
        user: 'johndoe',
        password: 'password123',
      };

      const detailDto: DetailLoginDto = {
        ipAddress: '127.0.0.1',
        device: 'Chrome',
        location: 'Ecuador',
      };

      const mockUser = {
        id: 'user-id',
        user: 'johndoe',
        email: 'john.doe@example.com',
        password: 'hashedPassword',
        role: RoleEnum.TEACHER,
        status: true,
      };

      const mockSession = {
        id: 'session-id',
        user: { role: RoleEnum.TEACHER },
      };

      (compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaService.teacher.findFirstOrThrow.mockResolvedValue({ id: 'teacher-id' });
      
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockCnx = {
          session: {
            create: jest.fn().mockResolvedValue(mockSession),
            update: jest.fn(),
          },
        };
        return callback(mockCnx);
      });

      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto, detailDto);

      expect(mockPrismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { user: 'johndoe' },
        select: {
          id: true,
          user: true,
          email: true,
          password: true,
          role: true,
          status: true,
        },
      });

      expect(result).toBeDefined();
    });

    it('should throw error for non-existent email', async () => {
      const loginDto: LoginDto = {
        user: 'nonexistent@example.com',
        password: 'password123',
      };

      const detailDto: DetailLoginDto = {
        ipAddress: '127.0.0.1',
        device: 'Chrome',
        location: 'Ecuador',
      };

      mockPrismaService.user.findUniqueOrThrow.mockRejectedValue(new Error());

      await expect(service.login(loginDto, detailDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginDto, detailDto)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });
  });
});
