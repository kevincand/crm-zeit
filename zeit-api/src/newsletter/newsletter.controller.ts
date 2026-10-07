import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Post('unsubscribe/:token')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@Param('token') token: string) {
    return this.newsletterService.unsubscribe(token);
  }
}