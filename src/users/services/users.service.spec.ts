import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@/libs/prisma.service';
import { Logger } from '@nestjs/common';
import adminConfig from '../config/admin.config';
import { CreateUserDto } from '../dtos/users.dto';
import { BadRequestException } from '@nestjs/common';

// Mock Role enum since Prisma client is not generated
enum Role {
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
}

describe('UsersService - Email Registration', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    teacher: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockLogger = {
    error: jest.fn(),
  };

  const mockAdminConfig = {
    user: 'admin',
    password: 'admin123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: adminConfig.KEY,
          useValue: mockAdminConfig,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTeacher with email', () => {
    it('should create teacher with email successfully', async () => {
      const createUserDto: CreateUserDto = {
        identification: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        birthDate: '1990-01-01',
        genre: 'M',
        password: 'Password123',
        isPending: false,
      };

      mockPrismaService.teacher.findFirst.mockResolvedValue(null);
      mockPrismaService.teacher.create.mockResolvedValue({
        id: 'teacher-id',
        user: {
          id: 'user-id',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const result = await service.createTeacher(createUserDto);

      expect(mockPrismaService.teacher.findFirst).toHaveBeenCalledWith({
        where: {
          user: {
            OR: [
              { user: createUserDto.identification },
              { identification: createUserDto.identification },
              { email: createUserDto.email },
            ],
          },
        },
      });

      expect(mockPrismaService.teacher.create).toHaveBeenCalledWith({
        data: {
          user: {
            create: {
              password: expect.any(String),
              role: Role.TEACHER,
              identification: createUserDto.identification,
              firstName: createUserDto.firstName,
              lastName: createUserDto.lastName,
              birthDate: createUserDto.birthDate,
              genre: createUserDto.genre,
              user: createUserDto.identification,
              email: createUserDto.email,
            },
          },
          isPending: false,
        },
      });

      expect(result).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const createUserDto: CreateUserDto = {
        identification: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        birthDate: '1990-01-01',
        genre: 'M',
        password: 'Password123',
        isPending: false,
      };

      mockPrismaService.teacher.findFirst.mockResolvedValue({
        id: 'existing-teacher',
        user: { email: 'existing@example.com' },
      });

      await expect(service.createTeacher(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createTeacher(createUserDto)).rejects.toThrow(
        'Ya existe un profesor con esa identificación, usuario o correo electrónico',
      );
    });

    it('should create teacher without email when email is not provided', async () => {
      const createUserDto: CreateUserDto = {
        identification: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        genre: 'M',
        password: 'Password123',
        isPending: false,
      };

      mockPrismaService.teacher.findFirst.mockResolvedValue(null);
      mockPrismaService.teacher.create.mockResolvedValue({
        id: 'teacher-id',
        user: {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const result = await service.createTeacher(createUserDto);

      expect(mockPrismaService.teacher.findFirst).toHaveBeenCalledWith({
        where: {
          user: {
            OR: [
              { user: createUserDto.identification },
              { identification: createUserDto.identification },
            ],
          },
        },
      });

      expect(mockPrismaService.teacher.create).toHaveBeenCalledWith({
        data: {
          user: {
            create: {
              password: expect.any(String),
              role: Role.TEACHER,
              identification: createUserDto.identification,
              firstName: createUserDto.firstName,
              lastName: createUserDto.lastName,
              birthDate: createUserDto.birthDate,
              genre: createUserDto.genre,
              user: createUserDto.identification,
              email: undefined,
            },
          },
          isPending: false,
        },
      });

      expect(result).toBeDefined();
    });
  });
});
