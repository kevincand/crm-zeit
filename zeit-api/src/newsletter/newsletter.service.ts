import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionStatus, SubscriptionEventType, UserRole } from '../../generated/prisma/client';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NewsletterService {
    constructor(private prisma: PrismaService, private mailService: MailService,) { }

    async subscribe(dto: SubscribeDto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const source = dto.source || 'PUBLIC_API';

        return this.prisma.$transaction(async (tx) => {
            // 1. Localiza um admin padrão para vincular como criado_por do contato
            let systemUser = await tx.user.findFirst({ where: { role: UserRole.ADMIN } });
            if (!systemUser) {
                systemUser = await tx.user.findFirst();
            }

            // 2. Busca ou cria o Contato
            let contact = await tx.contact.findUnique({ where: { email: normalizedEmail } });

            if (!contact) {
                contact = await tx.contact.create({
                    data: {
                        name: dto.name,
                        email: normalizedEmail,
                        createdById: systemUser?.id ?? "",
                    },
                });
            }

            // 3. Busca ou cria a Subscription
            let subscription = await tx.subscription.findUnique({
                where: { contactId: contact.id },
            });


            if (!subscription) {
                subscription = await tx.subscription.create({
                    data: {
                        contactId: contact.id,
                        status: SubscriptionStatus.SUBSCRIBED,
                        subscribedAt: new Date(),
                        source,
                    },
                });
            } else if (subscription.status !== SubscriptionStatus.SUBSCRIBED) {
                subscription = await tx.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: SubscriptionStatus.SUBSCRIBED,
                        resubscribedAt: new Date(),
                    },
                });
            }

            // 4. Registra o Evento de Inscrição
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: subscription.id,
                    type: SubscriptionEventType.SUBSCRIBED,
                    source,
                    metadata: { ip: 'public_request' },
                },
            });

            await this.mailService.enqueueMail({
                to: contact.email ?? "",
                subject: 'Bem-vindo à Newsletter Zeit!',
                html: `<p>Olá ${contact.name}, sua inscrição foi realizada com sucesso!</p>`,
            });

            return {
                message: 'Inscrição realizada com sucesso.',
                email: contact.email,
            };
        });
    }

    async generateUnsubscribeToken(subscriptionId: string): Promise<string> {
        // Gera token seguro e armazena apenas o hash sha256 no banco
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await this.prisma.unsubscribeToken.create({
            data: {
                subscriptionId,
                tokenHash,
            },
        });

        return rawToken;
    }

    async unsubscribe(rawToken: string) {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const tokenRecord = await this.prisma.unsubscribeToken.findUnique({
            where: { tokenHash },
            include: { subscription: true },
        });

        if (!tokenRecord) {
            throw new NotFoundException('Token de cancelamento inválido ou expirado.');
        }

        if (tokenRecord.usedAt) {
            throw new BadRequestException('Este link de cancelamento já foi utilizado.');
        }

        return this.prisma.$transaction(async (tx) => {
            // Marcar token como utilizado
            await tx.unsubscribeToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: new Date() },
            });

            // Atualizar status da assinatura
            await tx.subscription.update({
                where: { id: tokenRecord.subscriptionId },
                data: {
                    status: SubscriptionStatus.UNSUBSCRIBED,
                    unsubscribedAt: new Date(),
                },
            });

            // Registrar evento
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: tokenRecord.subscriptionId,
                    type: SubscriptionEventType.UNSUBSCRIBED,
                    source: 'UNSUBSCRIBE_LINK',
                },
            });

            return { message: 'Sua inscrição foi cancelada com sucesso.' };
        });
    }
}