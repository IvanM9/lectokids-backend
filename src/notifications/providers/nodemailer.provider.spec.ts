import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NodemailerProvider } from './nodemailer.provider';
import { EmailOptions } from '../interfaces/email-provider.interface';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('NodemailerProvider', () => {
  let provider: NodemailerProvider;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    } as any;

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<NodemailerProvider>(NodemailerProvider);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    const mockEmailOptions: EmailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    };

    beforeEach(() => {
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        const config = {
          SMTP_HOST: 'smtp.example.com',
          SMTP_PORT: 587,
          SMTP_SECURE: false,
          SMTP_USER: 'user@example.com',
          SMTP_PASSWORD: 'password',
          SMTP_FROM: 'from@example.com',
        };
        return config[key] || defaultValue;
      });
    });

    it('should send email successfully', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const result = await provider.sendEmail(mockEmailOptions);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'user@example.com',
          pass: 'password',
        },
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'from@example.com',
        to: 'test@example.com',
        cc: undefined,
        bcc: undefined,
        subject: 'Test Subject',
        text: undefined,
        html: '<p>Test content</p>',
        attachments: undefined,
      });

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
      });

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Email sent successfully: test-message-id',
      );
    });

    it('should handle multiple recipients', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const emailOptionsWithMultipleRecipients: EmailOptions = {
        ...mockEmailOptions,
        to: ['test1@example.com', 'test2@example.com'],
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      };

      await provider.sendEmail(emailOptionsWithMultipleRecipients);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'from@example.com',
        to: 'test1@example.com, test2@example.com',
        cc: 'cc1@example.com, cc2@example.com',
        bcc: 'bcc1@example.com, bcc2@example.com',
        subject: 'Test Subject',
        text: undefined,
        html: '<p>Test content</p>',
        attachments: undefined,
      });
    });

    it('should handle attachments', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const emailOptionsWithAttachments: EmailOptions = {
        ...mockEmailOptions,
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test content',
            contentType: 'text/plain',
          },
        ],
      };

      await provider.sendEmail(emailOptionsWithAttachments);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'from@example.com',
        to: 'test@example.com',
        cc: undefined,
        bcc: undefined,
        subject: 'Test Subject',
        text: undefined,
        html: '<p>Test content</p>',
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test content',
            contentType: 'text/plain',
          },
        ],
      });
    });

    it('should use custom from address when provided', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const emailOptionsWithCustomFrom: EmailOptions = {
        ...mockEmailOptions,
        from: 'custom@example.com',
      };

      await provider.sendEmail(emailOptionsWithCustomFrom);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'custom@example.com',
        to: 'test@example.com',
        cc: undefined,
        bcc: undefined,
        subject: 'Test Subject',
        text: undefined,
        html: '<p>Test content</p>',
        attachments: undefined,
      });
    });

    it('should handle sending errors', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const result = await provider.sendEmail(mockEmailOptions);

      expect(result).toEqual({
        success: false,
        error: 'SMTP connection failed',
      });

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to send email: SMTP connection failed',
        error.stack,
      );
    });

    it('should throw error when required SMTP configuration is missing', async () => {
      const providerWithMissingConfig = new NodemailerProvider({
        get: jest.fn().mockImplementation((key) => {
          const config = {
            SMTP_USER: 'user@example.com',
            SMTP_PASSWORD: 'password',
          };
          return config[key];
        }),
      } as any);

      await expect(
        providerWithMissingConfig.sendEmail(mockEmailOptions),
      ).rejects.toThrow('Missing required SMTP configuration: SMTP_HOST');
    });

    it('should initialize transporter only once', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      await provider.sendEmail(mockEmailOptions);
      await provider.sendEmail(mockEmailOptions);

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    });
  });
});
