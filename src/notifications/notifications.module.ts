import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailProviderFactory } from './factories/email-provider.factory';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { ResendProvider } from './providers/resend.provider';

@Module({
  providers: [
    EmailService,
    EmailProviderFactory,
    NodemailerProvider,
    ResendProvider,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
