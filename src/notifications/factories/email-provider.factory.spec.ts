import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailProviderFactory } from './email-provider.factory';
import { EmailProviderType } from '../enums/email-provider.enum';
import { NodemailerProvider } from '../providers/nodemailer.provider';
import { ResendProvider } from '../providers/resend.provider';

describe('EmailProviderFactory', () => {
  let factory: EmailProviderFactory;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProviderFactory,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    factory = module.get<EmailProviderFactory>(EmailProviderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProvider', () => {
    it('should create NodemailerProvider when type is NODEMAILER', () => {
      const provider = factory.createProvider(EmailProviderType.NODEMAILER);

      expect(provider).toBeInstanceOf(NodemailerProvider);
    });

    it('should create ResendProvider when type is RESEND', () => {
      const provider = factory.createProvider(EmailProviderType.RESEND);

      expect(provider).toBeInstanceOf(ResendProvider);
    });

    it('should throw error for unsupported provider type', () => {
      const unsupportedType = 'unsupported' as EmailProviderType;

      expect(() => factory.createProvider(unsupportedType)).toThrow(
        'Unsupported email provider type: unsupported',
      );
    });
  });

  describe('getDefaultProvider', () => {
    it('should return NodemailerProvider when EMAIL_PROVIDER config is NODEMAILER', () => {
      mockConfigService.get.mockReturnValue(EmailProviderType.NODEMAILER);

      const provider = factory.getDefaultProvider();

      expect(mockConfigService.get).toHaveBeenCalledWith(
        'EMAIL_PROVIDER',
        EmailProviderType.NODEMAILER,
      );
      expect(provider).toBeInstanceOf(NodemailerProvider);
    });

    it('should return ResendProvider when EMAIL_PROVIDER config is RESEND', () => {
      mockConfigService.get.mockReturnValue(EmailProviderType.RESEND);

      const provider = factory.getDefaultProvider();

      expect(mockConfigService.get).toHaveBeenCalledWith(
        'EMAIL_PROVIDER',
        EmailProviderType.NODEMAILER,
      );
      expect(provider).toBeInstanceOf(ResendProvider);
    });

    it('should return NodemailerProvider by default when no config is set', () => {
      mockConfigService.get.mockImplementation(
        (key, defaultValue) => defaultValue,
      );

      const provider = factory.getDefaultProvider();

      expect(provider).toBeInstanceOf(NodemailerProvider);
    });
  });
});
