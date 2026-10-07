import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { ProviderWebhookDto } from './dto/provider-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('provider')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() dto: ProviderWebhookDto) {
    return this.webhooksService.handleWebhook(dto);
  }
}