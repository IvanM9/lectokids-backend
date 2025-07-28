import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, DetailLoginDto } from './dtos/LoginDto';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return a token when login is successful', async () => {
      const loginDto: LoginDto = {
        user: 'test@example.com',
        password: 'password',
      };
      const detailDto: DetailLoginDto = {
        ipAddress: '127.0.0.1',
        device: 'test-device',
        location: 'test-location',
      };
      const expectedResult = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        role: Role.Estudiante,
        hasEmail: true,
      };

      vi.spyOn(service, 'login').mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, detailDto);

      expect(result).toEqual({ data: expectedResult, message: 'Bienvenido' });
      expect(service.login).toHaveBeenCalledWith(loginDto, detailDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        user: 'test@example.com',
        password: 'wrong-password',
      };
      const detailDto: DetailLoginDto = {
        ipAddress: '127.0.0.1',
        device: 'test-device',
        location: 'test-location',
      };

      vi.spyOn(service, 'login').mockRejectedValue(new UnauthorizedException());

      await expect(controller.login(loginDto, detailDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the correct user id', async () => {
      const req = { user: { id: 'test-user-id' } };
      await controller.logout(req);
      expect(service.logout).toHaveBeenCalledWith(req.user.id);
    });
  });
});
