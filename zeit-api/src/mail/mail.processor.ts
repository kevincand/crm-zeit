import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import * as mailProviderInterface from './interfaces/mail-provider.interface';

@Processor('email', {
  limiter: {
    max: 150,          // Máximo de 150 e-mails
    duration: 3600000, // Janela de tempo de 1 hora
  },
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    @Inject(mailProviderInterface.MAIL_PROVIDER) private readonly mailProvider: mailProviderInterface.IMailProvider,
  ) {
    super();
  }

  async process(job: Job<mailProviderInterface.SendMailOptions>): Promise<any> {
    this.logger.log(`[JOB ${job.id}] Processando envio para: ${job.data.to}`);

    try {
      const result = await this.mailProvider.sendMail(job.data);
      this.logger.log(`[JOB ${job.id}] Sucesso! Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`[JOB ${job.id}] Falha ao enviar para ${job.data.to}:`, error);
      throw error; // Lança o erro para o BullMQ aplicar a regra de retry/backoff
    }
  }
}