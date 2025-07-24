import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from './notifications.module';
import { EmailService } from './services/email.service';
import { EmailProviderFactory } from './factories/email-provider.factory';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { ResendProvider } from './providers/resend.provider';

describe('NotificationsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        NotificationsModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide EmailService', () => {
    const emailService = module.get<EmailService>(EmailService);
    expect(emailService).toBeDefined();
    expect(emailService).toBeInstanceOf(EmailService);
  });

  it('should provide EmailProviderFactory', () => {
    const emailProviderFactory =
      module.get<EmailProviderFactory>(EmailProviderFactory);
    expect(emailProviderFactory).toBeDefined();
    expect(emailProviderFactory).toBeInstanceOf(EmailProviderFactory);
  });

  it('should provide NodemailerProvider', () => {
    const nodemailerProvider =
      module.get<NodemailerProvider>(NodemailerProvider);
    expect(nodemailerProvider).toBeDefined();
    expect(nodemailerProvider).toBeInstanceOf(NodemailerProvider);
  });

  it('should provide ResendProvider', () => {
    const resendProvider = module.get<ResendProvider>(ResendProvider);
    expect(resendProvider).toBeDefined();
    expect(resendProvider).toBeInstanceOf(ResendProvider);
  });

  it('should export EmailService', () => {
    const exports = Reflect.getMetadata('exports', NotificationsModule);
    expect(exports).toContain(EmailService);
  });
});
