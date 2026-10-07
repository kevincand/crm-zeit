import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IMailProvider, SendMailOptions, MailSendResult } from '../interfaces/mail-provider.interface';
import { PublicTokensService } from '../../token/public-token.service'; // Importe o serviço

@Injectable()
export class SmtpMailProvider implements IMailProvider {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(SmtpMailProvider.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(options: SendMailOptions & { contactId?: string }): Promise<MailSendResult> {
    
    const info = await this.transporter.sendMail({
      from: `"${options.fromName || 'Zeit'}" <${options.fromEmail || process.env.SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      // Inclui o header apenas se a URL for fornecida
      ...(options.unsubscribeUrl && {
        headers: {
          'List-Unsubscribe': `<${options.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });

    return {
      messageId: info.messageId,
      success: true,
    };
  }
}