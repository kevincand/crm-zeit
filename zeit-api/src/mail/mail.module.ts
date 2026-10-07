import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';
import { MAIL_PROVIDER } from './interfaces/mail-provider.interface';
import { SmtpMailProvider } from './providers/smtp-mail.provider';
import { PublicTokensService } from '../token/public-token.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'sua_chave_secreta' }), // Necessário se usar JwtService
  ],
  providers: [
    MailService,
    MailProcessor,
    PublicTokensService,
    {
      provide: MAIL_PROVIDER,
      useClass: SmtpMailProvider // ConsoleMailProvider, // Facilmente trocável por AmazonSesProvider ou ResendProvider
    },
  ],
  exports: [MailService, PublicTokensService],
})
export class MailModule { }