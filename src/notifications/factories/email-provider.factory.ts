import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from '../interfaces/email-provider.interface';
import { EmailProviderType } from '../enums/email-provider.enum';
import { NodemailerProvider } from '../providers/nodemailer.provider';
import { ResendProvider } from '../providers/resend.provider';

@Injectable()
export class EmailProviderFactory {
  constructor(private configService: ConfigService) {}

  createProvider(type: EmailProviderType): IEmailProvider {
    switch (type) {
      case EmailProviderType.NODEMAILER:
        return new NodemailerProvider(this.configService);
      case EmailProviderType.RESEND:
        return new ResendProvider(this.configService);
      default:
        throw new Error(`Unsupported email provider type: ${type}`);
    }
  }

  getDefaultProvider(): IEmailProvider {
    const defaultProvider = this.configService.get<EmailProviderType>(
      'EMAIL_PROVIDER',
      EmailProviderType.NODEMAILER,
    );
    return this.createProvider(defaultProvider);
  }
}
