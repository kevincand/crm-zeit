import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports:[MailModule],
  providers: [NewsletterService],
  controllers: [NewsletterController]
})
export class NewsletterModule {}
