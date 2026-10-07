import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailEventType } from '../../generated/prisma/client';

@Injectable()
export class TrackingService {
  // Buffer de uma imagem GIF transparente 1x1 em Base64
  private readonly TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64',
  );

  constructor(private prisma: PrismaService) {}

  getPixelBuffer(): Buffer {
    return this.TRANSPARENT_GIF;
  }

  async trackOpen(recipientId: string, ip?: string, userAgent?: string) {
    const recipient = await this.prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) return;

    await this.prisma.emailEvent.create({
      data: {
        campaignRecipientId: recipientId,
        type: EmailEventType.OPENED,
        ip,
        userAgent,
      },
    });
  }

  async trackClick(linkId: string, recipientId: string, ip?: string, userAgent?: string) {
    const link = await this.prisma.emailLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException('Link não encontrado.');
    }

    // Registra o evento de clique de forma assíncrona
    await this.prisma.emailEvent.create({
      data: {
        campaignRecipientId: recipientId,
        type: EmailEventType.CLICKED,
        ip,
        userAgent,
        metadata: { linkId, originalUrl: link.url },
      },
    });

    return link.url;
  }
}