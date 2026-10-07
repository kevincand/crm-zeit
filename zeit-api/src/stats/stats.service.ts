import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus, EmailEventType, CampaignRecipientStatus } from '../../generated/prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalContacts,
      subscribedCount,
      unsubscribedCount,
      hardBounceCount,
      complaintCount,
      totalCampaigns,
    ] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.SUBSCRIBED } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.UNSUBSCRIBED } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.HARD_BOUNCE } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.COMPLAINT } }),
      this.prisma.campaign.count(),
    ]);

    return {
      contacts: {
        total: totalContacts,
        activeSubscribers: subscribedCount,
        unsubscribed: unsubscribedCount,
        hardBounces: hardBounceCount,
        complaints: complaintCount,
      },
      totalCampaigns,
    };
  }

  async getCampaignStats(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    // Contagem de destinatários por status
    const recipientStats = await this.prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { _all: true },
    });

    const statusMap = recipientStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<CampaignRecipientStatus, number>);

    const totalRecipients = await this.prisma.campaignRecipient.count({
      where: { campaignId },
    });

    // Aberturas e cliques únicos
    const uniqueOpens = await this.prisma.emailEvent.findMany({
      where: {
        campaignRecipient: { campaignId },
        type: EmailEventType.OPENED,
      },
      distinct: ['campaignRecipientId'],
    });

    const uniqueClicks = await this.prisma.emailEvent.findMany({
      where: {
        campaignRecipient: { campaignId },
        type: EmailEventType.CLICKED,
      },
      distinct: ['campaignRecipientId'],
    });

    const openCount = uniqueOpens.length;
    const clickCount = uniqueClicks.length;
    const deliveredCount = statusMap.DELIVERED || statusMap.SENT || 0;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: campaign.status,
      metrics: {
        totalRecipients,
        sent: statusMap.SENT || 0,
        delivered: deliveredCount,
        bounced: statusMap.BOUNCED || 0,
        failed: statusMap.FAILED || 0,
        uniqueOpens: openCount,
        uniqueClicks: clickCount,
      },
      rates: {
        deliveryRate: totalRecipients > 0 ? ((deliveredCount / totalRecipients) * 100).toFixed(2) + '%' : '0%',
        openRate: deliveredCount > 0 ? ((openCount / deliveredCount) * 100).toFixed(2) + '%' : '0%',
        clickRate: openCount > 0 ? ((clickCount / openCount) * 100).toFixed(2) + '%' : '0%',
      },
    };
  }
}