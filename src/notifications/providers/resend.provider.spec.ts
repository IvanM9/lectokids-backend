import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ResendProvider } from './resend.provider';
import { EmailOptions } from '../interfaces/email-provider.interface';

global.fetch = vi.fn();

describe('ResendProvider', () => {
  let provider: ResendProvider;
  let mockConfigService: vi.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: vi.fn(),
    } as any;

    mockConfigService.get
      .mockReturnValueOnce('test-api-key') // RESEND_API_KEY
      .mockReturnValue('from@example.com'); // RESEND_FROM_EMAIL

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<ResendProvider>(ResendProvider);

    vi.spyOn(Logger.prototype, 'log').mockImplementation();
    vi.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    (fetch as unknown as vi.Mock).mockClear();
  });

  describe('sendEmail', () => {
    const mockEmailOptions: EmailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    };

    it('should send email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'resend-message-id' }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

      const result = await provider.sendEmail(mockEmailOptions);

      expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'from@example.com',
          to: ['test@example.com'],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        }),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'resend-message-id',
      });

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Email sent successfully via Resend: resend-message-id',
      );
    });

    it('should handle multiple recipients', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'resend-message-id' }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

      const emailOptionsWithMultipleRecipients: EmailOptions = {
        ...mockEmailOptions,
        to: ['test1@example.com', 'test2@example.com'],
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      };

      await provider.sendEmail(emailOptionsWithMultipleRecipients);

      expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"from":"from@example.com"'),
      });

      const callArgs = (fetch as unknown as vi.Mock).mock.calls[0][1];
      const payload = JSON.parse(callArgs.body);

      expect(payload).toEqual({
        from: 'from@example.com',
        to: ['test1@example.com', 'test2@example.com'],
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });
    });

    it('should handle single string recipients', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'resend-message-id' }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

      const emailOptionsWithSingleRecipients: EmailOptions = {
        ...mockEmailOptions,
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
      };

      await provider.sendEmail(emailOptionsWithSingleRecipients);

      expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"from":"from@example.com"'),
      });

      const callArgs = (fetch as unknown as vi.Mock).mock.calls[0][1];
      const payload = JSON.parse(callArgs.body);

      expect(payload).toEqual({
        from: 'from@example.com',
        to: ['test@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });
    });

    it('should handle attachments with string content', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'resend-message-id' }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

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

      expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'from@example.com',
          to: ['test@example.com'],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
          attachments: [
            {
              filename: 'test.txt',
              content: Buffer.from('Test content').toString('base64'),
              content_type: 'text/plain',
            },
          ],
        }),
      });
    });

    it('should handle attachments with Buffer content', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'resend-message-id' }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

      const bufferContent = Buffer.from('Test content');
      const emailOptionsWithBufferAttachments: EmailOptions = {
        ...mockEmailOptions,
        attachments: [
          {
            filename: 'test.txt',
            content: bufferContent,
            contentType: 'text/plain',
          },
        ],
      };

      await provider.sendEmail(emailOptionsWithBufferAttachments);

      expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'from@example.com',
          to: ['test@example.com'],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
          attachments: [
            {
              filename: 'test.txt',
              content: bufferContent.toString('base64'),
              content_type: 'text/plain',
            },
          ],
        }),
      });
    });

    it('should use custom from address when provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'resend-message-id' }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

      const emailOptionsWithCustomFrom: EmailOptions = {
        ...mockEmailOptions,
        from: 'custom@example.com',
      };

      await provider.sendEmail(emailOptionsWithCustomFrom);

      expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'custom@example.com',
          to: ['test@example.com'],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        }),
      });
    });

    it('should include both text and html when provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'resend-message-id' }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

      const emailOptionsWithTextAndHtml: EmailOptions = {
        ...mockEmailOptions,
        text: 'Plain text content',
      };

      await provider.sendEmail(emailOptionsWithTextAndHtml);

      expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'from@example.com',
          to: ['test@example.com'],
          subject: 'Test Subject',
          text: 'Plain text content',
          html: '<p>Test content</p>',
        }),
      });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          message: 'Invalid API key',
        }),
      };

      (fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

      const result = await provider.sendEmail(mockEmailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Invalid API key',
      });

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to send email via Resend: Invalid API key',
        expect.any(String),
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      (fetch as unknown as vi.Mock).mockRejectedValue(error);

      const result = await provider.sendEmail(mockEmailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      });

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to send email via Resend: Network error',
        error.stack,
      );
    });

    it('should throw error when RESEND_API_KEY is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const providerWithoutApiKey = new ResendProvider(mockConfigService);

      await expect(
        providerWithoutApiKey.sendEmail(mockEmailOptions),
      ).rejects.toThrow('RESEND_API_KEY is required for Resend provider');
    });
  });
});
