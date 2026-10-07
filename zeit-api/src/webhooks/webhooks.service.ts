import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderWebhookDto, WebhookEventType } from './dto/provider-webhook.dto';
import { SubscriptionStatus, SubscriptionEventType, CampaignRecipientStatus } from '../../generated/prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async handleWebhook(dto: ProviderWebhookDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const contact = await this.prisma.contact.findUnique({
      where: { email: normalizedEmail },
      include: { subscription: true },
    });

    if (!contact || !contact.subscription) {
      this.logger.warn(`[WEBHOOK] Notificação recebida para e-mail não cadastrado: ${normalizedEmail}`);
      return { message: 'Contato não encontrado, evento ignorado.' };
    }

    const subscriptionId = contact.subscription.id;

    if (dto.type === WebhookEventType.BOUNCE) {
      this.logger.log(`[WEBHOOK] Processando HARD_BOUNCE para: ${normalizedEmail}`);

      await this.prisma.$transaction(async (tx) => {
        // 1. Atualizar assinatura do contato para HARD_BOUNCE
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.HARD_BOUNCE },
        });

        // 2. Registrar evento no histórico da assinatura
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId,
            type: SubscriptionEventType.HARD_BOUNCE,
            source: 'PROVIDER_WEBHOOK',
            metadata: { reason: dto.reason },
          },
        });

        // 3. Atualizar status do destinatário da campanha caso tenha o ID do provedor
        if (dto.providerMessageId) {
          await tx.campaignRecipient.updateMany({
            where: { providerMessageId: dto.providerMessageId },
            data: { status: CampaignRecipientStatus.BOUNCED },
          });
        }
      });
    } else if (dto.type === WebhookEventType.COMPLAINT) {
      this.logger.log(`[WEBHOOK] Processando COMPLAINT para: ${normalizedEmail}`);

      await this.prisma.$transaction(async (tx) => {
        // 1. Bloquear contato para marketing atualizando para COMPLAINT
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.COMPLAINT },
        });

        // 2. Registrar evento no histórico
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId,
            type: SubscriptionEventType.COMPLAINT,
            source: 'PROVIDER_WEBHOOK',
            metadata: { reason: dto.reason },
          },
        });

        // 3. Atualizar status na campanha
        if (dto.providerMessageId) {
          await tx.campaignRecipient.updateMany({
            where: { providerMessageId: dto.providerMessageId },
            data: { status: CampaignRecipientStatus.COMPLAINT },
          });
        }
      });
    }

    return { message: 'Evento processado com sucesso.' };
  }
}