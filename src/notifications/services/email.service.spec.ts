import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProviderFactory } from '../factories/email-provider.factory';
import { EmailProviderType } from '../enums/email-provider.enum';
import {
  IEmailProvider,
  EmailOptions,
  EmailResponse,
} from '../interfaces/email-provider.interface';

describe('EmailService', () => {
  let service: EmailService;
  let mockEmailProviderFactory: vi.Mocked<EmailProviderFactory>;
  let mockEmailProvider: vi.Mocked<IEmailProvider>;

  beforeEach(async () => {
    mockEmailProvider = {
      sendEmail: vi.fn(),
    };

    mockEmailProviderFactory = {
      createProvider: vi.fn().mockReturnValue(mockEmailProvider),
      getDefaultProvider: vi.fn().mockReturnValue(mockEmailProvider),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: EmailProviderFactory,
          useValue: mockEmailProviderFactory,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);

    vi.spyOn(Logger.prototype, 'log').mockImplementation();
    vi.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    const mockEmailOptions: EmailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    };

    it('should send email successfully using default provider', async () => {
      const expectedResponse: EmailResponse = {
        success: true,
        messageId: 'test-message-id',
      };

      mockEmailProvider.sendEmail.mockResolvedValue(expectedResponse);

      const result = await service.sendEmail(mockEmailOptions);

      expect(mockEmailProviderFactory.getDefaultProvider).toHaveBeenCalled();
      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
        mockEmailOptions,
      );
      expect(result).toEqual(expectedResponse);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Email sent successfully to test@example.com',
      );
    });

    it('should send email successfully using specific provider', async () => {
      const expectedResponse: EmailResponse = {
        success: true,
        messageId: 'test-message-id',
      };

      mockEmailProvider.sendEmail.mockResolvedValue(expectedResponse);

      const result = await service.sendEmail(
        mockEmailOptions,
        EmailProviderType.RESEND,
      );

      expect(mockEmailProviderFactory.createProvider).toHaveBeenCalledWith(
        EmailProviderType.RESEND,
      );
      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
        mockEmailOptions,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should log error when email sending fails', async () => {
      const failureResponse: EmailResponse = {
        success: false,
        error: 'SMTP connection failed',
      };

      mockEmailProvider.sendEmail.mockResolvedValue(failureResponse);

      const result = await service.sendEmail(mockEmailOptions);

      expect(result).toEqual(failureResponse);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to send email to test@example.com: SMTP connection failed',
      );
    });

    it('should handle exceptions and return error response', async () => {
      const error = new Error('Network error');
      mockEmailProvider.sendEmail.mockRejectedValue(error);

      const result = await service.sendEmail(mockEmailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      });
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error in email service: Network error',
        error.stack,
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      const expectedResponse: EmailResponse = {
        success: true,
        messageId: 'welcome-message-id',
      };

      mockEmailProvider.sendEmail.mockResolvedValue(expectedResponse);

      const result = await service.sendWelcomeEmail(
        'user@example.com',
        'John Doe',
      );

      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Bienvenido a LectoKids',
        html: expect.stringContaining('¡Bienvenido a LectoKids, John Doe!'),
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sendPasswordResetEmail', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.FRONTEND_URL = 'https://example.com';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should send password reset email with correct content and reset URL', async () => {
      const expectedResponse: EmailResponse = {
        success: true,
        messageId: 'reset-message-id',
      };

      mockEmailProvider.sendEmail.mockResolvedValue(expectedResponse);

      const result = await service.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
      );

      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Restablecer contraseña - LectoKids',
        html: expect.stringContaining(
          'https://example.com/reset-password?token=reset-token-123',
        ),
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sendNotificationEmail', () => {
    it('should send notification email with correct format', async () => {
      const expectedResponse: EmailResponse = {
        success: true,
        messageId: 'notification-message-id',
      };

      mockEmailProvider.sendEmail.mockResolvedValue(expectedResponse);

      const result = await service.sendNotificationEmail(
        'user@example.com',
        'Test Notification',
        '<p>This is a test notification</p>',
      );

      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Test Notification',
        html: expect.stringContaining('<p>This is a test notification</p>'),
      });
      expect(result).toEqual(expectedResponse);
    });
  });
});
