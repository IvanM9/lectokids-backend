import { Injectable, Logger } from '@nestjs/common';
import { EmailProviderFactory } from '../factories/email-provider.factory';
import {
  EmailOptions,
  EmailResponse,
  IEmailProvider,
} from '../interfaces/email-provider.interface';
import { EmailProviderType } from '../enums/email-provider.enum';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private emailProviderFactory: EmailProviderFactory) {}

  async sendEmail(
    options: EmailOptions,
    providerType?: EmailProviderType,
  ): Promise<EmailResponse> {
    try {
      const provider: IEmailProvider = providerType
        ? this.emailProviderFactory.createProvider(providerType)
        : this.emailProviderFactory.getDefaultProvider();

      const result = await provider.sendEmail(options);

      if (result.success) {
        this.logger.log(`Email sent successfully to ${options.to}`);
      } else {
        this.logger.error(
          `Failed to send email to ${options.to}: ${result.error}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error in email service: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      subject: 'Bienvenido a LectoKids',
      html: `
        <h1>¡Bienvenido a LectoKids, ${userName}!</h1>
        <p>Nos alegra tenerte con nosotros. Comienza tu aventura de lectura hoy mismo.</p>
        <p>¡Feliz lectura!</p>
        <p>El equipo de LectoKids</p>
      `,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<EmailResponse> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to,
      subject: 'Restablecer contraseña - LectoKids',
      html: `
        <h1>Restablecer contraseña</h1>
        <p>Has solicitado restablecer tu contraseña en LectoKids.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}">Restablecer contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p>El equipo de LectoKids</p>
      `,
    });
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>LectoKids</h2>
          <div>${content}</div>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Este es un correo automático de LectoKids. Por favor no respondas a este mensaje.
          </p>
        </div>
      `,
    });
  }
}
