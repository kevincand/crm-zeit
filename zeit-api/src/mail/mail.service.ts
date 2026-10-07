import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendMailOptions } from './interfaces/mail-provider.interface';

@Injectable()
export class MailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async enqueueMail(mailOptions: SendMailOptions) {
    return this.emailQueue.add('send-email', mailOptions, {
      attempts: 2, // 2 tentativas antes de mover para falha
      backoff: {
        type: 'exponential',
        delay: 3000, // Aguarda 3s, depois 6s...
      },
      removeOnComplete: true,
    });
  }
}