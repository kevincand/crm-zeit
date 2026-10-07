import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum WebhookEventType {
  BOUNCE = 'BOUNCE',
  COMPLAINT = 'COMPLAINT',
}

export class ProviderWebhookDto {
  @IsEnum(WebhookEventType, { message: 'Tipo de evento inválido.' })
  @IsNotEmpty()
  type!: WebhookEventType;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  providerMessageId?: string;

  @IsOptional()
  reason?: any;
}