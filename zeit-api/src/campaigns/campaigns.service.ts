import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignStatus, SubscriptionStatus, CampaignRecipientStatus } from '../../generated/prisma/client';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PublicTokensService } from '../token/public-token.service';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private readonly publicTokensService: PublicTokensService
  ) { }

  async create(dto: CreateCampaignDto, userId: string) {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        fromName: dto.fromName,
        fromEmail: dto.fromEmail,
        contentHtml: dto.contentHtml,
        createdById: userId,
      },
    });
  }

  async sendTest(campaignId: string, testEmail: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada.');

    await this.mailService.enqueueMail({
      to: testEmail.toLowerCase().trim(),
      subject: `[TESTE] ${campaign.subject}`,
      html: campaign.contentHtml,
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail,
    });

    return { message: `E-mail de teste enfileirado para ${testEmail}` };
  }

  async triggerCampaign(campaignId: string, groupIds?: string[], interestIds?: string[]) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!campaign) throw new NotFoundException('Campanha não encontrada.');
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Apenas campanhas em RASCUNHO (DRAFT) podem ser enviadas.');
    }

    // 1. Montar filtro de contatos elegíveis
    const whereCondition: any = {
      // REGRA LGPD/SEGURANÇA: Apenas inscritos ativos
      subscription: {
        status: SubscriptionStatus.SUBSCRIBED,
      },
    };

    if (groupIds && groupIds.length > 0) {
      whereCondition.groups = { some: { groupId: { in: groupIds } } };
    }

    if (interestIds && interestIds.length > 0) {
      whereCondition.interests = { some: { interestId: { in: interestIds } } };
    }

    // 2. Buscar contatos elegíveis
    const eligibleContacts = await this.prisma.contact.findMany({
      where: whereCondition,
      select: { id: true, email: true },
    });

    if (eligibleContacts.length === 0) {
      throw new BadRequestException('Nenhum contato elegível encontrado para os filtros selecionados.');
    }

    // 3. Atualizar status da campanha para PROCESSING
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.PROCESSING,
        startedAt: new Date(),
      },
    });

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

    // 4. Criar destinatários e enfileirar disparos
    for (const contact of eligibleContacts) {
      const recipient = await this.prisma.campaignRecipient.create({
        data: {
          campaignId: campaign.id,
          contactId: contact.id,
          email: contact.email ?? "",
          status: CampaignRecipientStatus.QUEUED,
          queuedAt: new Date(),
        },
      });

      let unsubscribeUrl = '';

      // Injeta o Pixel de Rastreamento de Abertura no final do HTML
      const trackingPixelHtml = `<img src="${baseUrl}/tracking/open/${recipient.id}" width="1" height="1" style=" style="width:1px;height:1px;border:0;opacity:0;" alt="" />`;
      const htmlWithTracking = `${campaign.contentHtml}${trackingPixelHtml}`;

      const token = this.publicTokensService.generateUnsubscribeToken(recipient.contactId);
      unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:4200'}/unsubscribe?token=${token}`;

      // Enfileirar na fila do BullMQ
      await this.mailService.enqueueMail({
        to: recipient.email,
        subject: campaign.subject,
        html: htmlWithTracking.replace("https://seu-dominio.com/cancelar-inscricao", unsubscribeUrl), // Passa a URL gerada
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        unsubscribeUrl: unsubscribeUrl,
      });
    }

    return {
      message: 'Campanha iniciada com sucesso.',
      totalRecipients: eligibleContacts.length,
    };
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { recipients: true } },
      },
    });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Apenas campanhas em rascunho (DRAFT) podem ser alteradas.');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.subject && { subject: dto.subject }),
        ...(dto.fromName && { fromName: dto.fromName }),
        ...(dto.fromEmail && { fromEmail: dto.fromEmail }),
        ...(dto.contentHtml && { contentHtml: dto.contentHtml }),
      },
    });
  }
}