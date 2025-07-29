import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  IEmailProvider,
  EmailOptions,
  EmailResponse,
} from '../interfaces/email-provider.interface';

@Injectable()
export class NodemailerProvider implements IEmailProvider {
  private readonly logger = new Logger(NodemailerProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {}

  private validateConfig(): void {
    const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
    const missingVars = requiredVars.filter(
      (varName) => !this.configService.get<string>(varName),
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required SMTP configuration: ${missingVars.join(', ')}`,
      );
    }
  }

  private initializeTransporter(): void {
    if (!this.transporter) {
      this.validateConfig();

      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASSWORD'),
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    this.initializeTransporter();

    try {
      const mailOptions = {
        from: options.from || this.configService.get<string>('SMTP_FROM'),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc,
        bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
      };
    }
  }
}
