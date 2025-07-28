import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/libs/prisma.service';
import jwtConfig from '../config/jwt.config';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { LoginDto, DetailLoginDto } from './dtos/LoginDto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RoleEnum } from '../enums/role.enum';
import { compare } from 'bcrypt';

vi.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    teacher: {
      findFirstOrThrow: vi.fn(),
    },
    student: {
      findFirstOrThrow: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn(),
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
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
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

    const setupSuccessfulLogin = () => {
      (compare as unknown as vi.Mock).mockResolvedValue(true);
      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaService.teacher.findFirstOrThrow.mockResolvedValue({
        id: 'teacher-id',
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockCnx = {
          session: {
            create: vi.fn().mockResolvedValue(mockSession),
            update: vi.fn(),
          },
        };
        return callback(mockCnx);
      });
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');
    };

    it('should login successfully with email', async () => {
      const loginDto: LoginDto = {
        user: 'john.doe@example.com',
        password: 'password123',
      };
      setupSuccessfulLogin();

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
        hasEmail: true,
      });
    });

    it('should login successfully with username', async () => {
      const loginDto: LoginDto = {
        user: 'johndoe',
        password: 'password123',
      };
      setupSuccessfulLogin();

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

    it('should throw BadRequestException for non-existent user', async () => {
      const loginDto: LoginDto = {
        user: 'nonexistent@example.com',
        password: 'password123',
      };
      mockPrismaService.user.findUniqueOrThrow.mockRejectedValue(new Error());

      await expect(service.login(loginDto, detailDto)).rejects.toThrow(
        new BadRequestException('Usuario no encontrado'),
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const loginDto: LoginDto = {
        user: 'john.doe@example.com',
        password: 'wrongpassword',
      };
      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      (compare as unknown as vi.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto, detailDto)).rejects.toThrow(
        new BadRequestException('Contraseña incorrecta'),
      );
    });
  });
});
