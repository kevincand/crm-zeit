import { Injectable, Logger } from '@nestjs/common';
import { IMailProvider, SendMailOptions, MailSendResult } from '../interfaces/mail-provider.interface';

@Injectable()
export class ConsoleMailProvider implements IMailProvider {
  private readonly logger = new Logger(ConsoleMailProvider.name);

  async sendMail(options: SendMailOptions): Promise<MailSendResult> {
    this.logger.log(`[DEV EMAIL SENT] Para: ${options.to} | Assunto: "${options.subject}"`);
    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      success: true,
    };
  }
}