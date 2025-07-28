import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IEmailProvider,
  EmailOptions,
  EmailResponse,
} from '../interfaces/email-provider.interface';

@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.resend.com';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY');
  }

  private validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY is required for Resend provider');
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    this.validateConfig();

    try {
      const payload = {
        from:
          options.from || this.configService.get<string>('RESEND_FROM_EMAIL'),
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        ...(options.text && { text: options.text }),
        ...(options.html && { html: options.html }),
        ...(options.cc && {
          cc: Array.isArray(options.cc) ? options.cc : [options.cc],
        }),
        ...(options.bcc && {
          bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc],
        }),
        ...(options.attachments && {
          attachments: options.attachments.map((att) => ({
            filename: att.filename,
            content: Buffer.isBuffer(att.content)
              ? att.content.toString('base64')
              : Buffer.from(att.content).toString('base64'),
            content_type: att.contentType,
          })),
        }),
      };

      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email via Resend');
      }

      this.logger.log(`Email sent successfully via Resend: ${result.id}`);

      return {
        success: true,
        messageId: result.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email via Resend: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }
}
