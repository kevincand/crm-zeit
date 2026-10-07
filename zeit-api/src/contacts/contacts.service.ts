import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { FilterContactDto } from './dto/filter-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { SubscriptionStatus } from '../../generated/prisma/client';
import { PublicSubscribeDto } from './dto/public-subscribe.dto';
import * as XLSX from 'xlsx';
import { LeadOrigin, FunnelStage } from '../../generated/prisma/client';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateContactDto, userId: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingContact = await this.prisma.contact.findUnique({
      where: { email: normalizedEmail },
      include: { subscription: true },
    });

    // 1. Se o contato existe e NÃO está deletado, lança o erro de duplicidade
    if (existingContact && existingContact.deletedAt === null) {
      throw new ConflictException('Contato com este e-mail já existe no sistema.');
    }

    const { groupIds = [], interestIds = [], ...contactData } = dto;

    // 2. Se o contato já existia mas estava deletado (Soft Deleted), REATIVA o registro
    if (existingContact && existingContact.deletedAt !== null) {
      return this.prisma.$transaction(async (tx) => {
        // Atualiza os dados do contato e zera a data de exclusão
        const updatedContact = await tx.contact.update({
          where: { id: existingContact.id },
          data: {
            ...contactData,
            email: normalizedEmail,
            deletedAt: null,
            groups: {
              deleteMany: {},
              create: groupIds.map((groupId) => ({ groupId })),
            },
            interests: {
              deleteMany: {},
              create: interestIds.map((interestId) => ({ interestId })),
            },
          },
          include: {
            subscription: true,
            groups: { include: { group: true } },
            interests: { include: { interest: true } },
          },
        });

        // Registra evento de reativação no histórico de assinatura se necessário
        if (existingContact.subscription) {
          await tx.subscriptionEvent.create({
            data: {
              subscriptionId: existingContact.subscription.id,
              type: 'SUBSCRIBED',
              source: 'MANUAL',
            },
          });
        }

        return updatedContact;
      });
    }

    // 3. Caso seja um contato totalmente novo, executa a sua lógica original com transação
    return this.prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          ...contactData,
          email: normalizedEmail,
          createdById: userId,
          groups: {
            create: groupIds.map((groupId) => ({ groupId })),
          },
          interests: {
            create: interestIds.map((interestId) => ({ interestId })),
          },
        },
      });

      await tx.subscription.create({
        data: {
          contactId: contact.id,
          status: SubscriptionStatus.SUBSCRIBED,
          subscribedAt: new Date(),
          source: 'MANUAL',
          events: {
            create: {
              type: 'SUBSCRIBED',
              source: 'MANUAL',
            },
          },
        },
      });

      return contact;
    });
  }

  async findAll(filters: FilterContactDto) {
    const where: any = {
      deletedAt: null, // Traz apenas contatos ativos
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.groupId) {
      where.groups = { some: { groupId: filters.groupId } };
    }

    if (filters.interestId) {
      where.interests = { some: { interestId: filters.interestId } };
    }

    return this.prisma.contact.findMany({
      where,
      include: {
        subscription: true,
        groups: { include: { group: true } },
        interests: { include: { interest: true } },
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        subscription: { include: { events: true } },
        groups: { include: { group: true } },
        interests: { include: { interest: true } },
      },
    });

    if (!contact) throw new NotFoundException('Contato não encontrado.');
    return contact;
  }
  async update(id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Contato não encontrado.');
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.company !== undefined) updateData.company = dto.company;
    if (dto.uf !== undefined) updateData.uf = dto.uf;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Atualização das relações de muitos-para-muitos
    if (dto.groupIds !== undefined) {
      updateData.groups = {
        deleteMany: {},
        create: dto.groupIds.map((groupId) => ({ groupId })),
      };
    }

    if (dto.interestIds !== undefined) {
      updateData.interests = {
        deleteMany: {},
        create: dto.interestIds.map((interestId) => ({ interestId })),
      };
    }

    return this.prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        subscription: true,
        groups: { include: { group: true } },
        interests: { include: { interest: true } },
      },
    });
  }

  async remove(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.deletedAt !== null) {
      throw new NotFoundException('Contato não encontrado.');
    }

    await this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Contato desativado com sucesso.' };
  }

  async unsubscribe(contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: { subscription: true },
    });

    if (!contact || !contact.subscription) {
      throw new NotFoundException('Inscrição não encontrada para este contato.');
    }

    // Atribui a uma constante antes do $transaction para manter o tipo narrowing
    const subscription = contact.subscription;

    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza status para UNSUBSCRIBED e marca data de cancelamento
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.UNSUBSCRIBED,
          unsubscribedAt: new Date(),
        },
      });

      // 2. Registra o evento de auditoria no histórico
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: updatedSubscription.id,
          type: 'UNSUBSCRIBED',
          source: 'MANUAL',
        },
      });

      return { message: 'Contato descadastrado com sucesso.' };
    });
  }

  async resubscribe(contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: { subscription: true },
    });

    if (!contact || !contact.subscription) {
      throw new NotFoundException('Inscrição não encontrada para este contato.');
    }

    if (
      contact.subscription.status === SubscriptionStatus.COMPLAINT ||
      contact.subscription.status === SubscriptionStatus.HARD_BOUNCE
    ) {
      throw new BadRequestException('Contatos com rejeição permanente ou denúncia de spam não podem ser reativados manualmente.');
    }

    const subscription = contact.subscription;

    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza o status para SUBSCRIBED e registra a data de reativação
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.SUBSCRIBED,
          resubscribedAt: new Date(),
        },
      });

      // 2. Registra o evento no histórico de auditoria
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: updatedSubscription.id,
          type: 'SUBSCRIBED',
          source: 'MANUAL',
        },
      });

      return { message: 'Inscrição reativada com sucesso.' };
    });
  }

  async publicSubscribe(dto: PublicSubscribeDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const { groupIds = [], interestIds = [], name, phone, company } = dto;

    const existingContact = await this.prisma.contact.findUnique({
      where: { email: normalizedEmail },
      include: { subscription: true },
    });

    // 1. Caso o contato JÁ EXISTA no banco de dados
    if (existingContact) {
      // Bloqueia reativação automática via formulário se o e-mail possui rejeição crítica ou denúncia de spam
      if (
        existingContact.subscription?.status === SubscriptionStatus.COMPLAINT ||
        existingContact.subscription?.status === SubscriptionStatus.HARD_BOUNCE
      ) {
        throw new BadRequestException(
          'Este e-mail possui restrições de entrega e não pode ser inscrito ativamente.',
        );
      }

      return this.prisma.$transaction(async (tx) => {
        // Reativa contato (caso estivesse deletado) e atualiza seus dados
        const contact = await tx.contact.update({
          where: { id: existingContact.id },
          data: {
            name: name || existingContact.name,
            phone: phone ?? existingContact.phone,
            company: company ?? existingContact.company,
            deletedAt: null, // Zera soft delete se houver
            ...(groupIds.length > 0 && {
              groups: {
                deleteMany: {},
                create: groupIds.map((groupId) => ({ groupId })),
              },
            }),
            ...(interestIds.length > 0 && {
              interests: {
                deleteMany: {},
                create: interestIds.map((interestId) => ({ interestId })),
              },
            }),
          },
        });

        let subscription = existingContact.subscription;

        // Garante que o status da assinatura mude para SUBSCRIBED
        if (subscription) {
          subscription = await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.SUBSCRIBED,
              resubscribedAt: new Date(),
            },
          });
        } else {
          subscription = await tx.subscription.create({
            data: {
              contactId: contact.id,
              status: SubscriptionStatus.SUBSCRIBED,
              subscribedAt: new Date(),
              source: 'WEB_FORM',
            },
          });
        }

        // Registra no histórico de auditoria
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: subscription.id,
            type: 'SUBSCRIBED',
            source: 'WEB_FORM',
          },
        });

        return { message: 'Inscrição realizada com sucesso.' };
      });
    }


    // 2. Caso seja um CONTATO TOTALMENTE NOVO
    return this.prisma.$transaction(async (tx) => {

      const systemUser = await tx.user.findUnique({
        where: { email: 'admin@zeit.com.br' },
        select: { id: true },
      });

      const contact = await tx.contact.create({
        data: {
          name,
          email: normalizedEmail,
          phone,
          company,
          createdById: systemUser?.id ?? '',
          groups: {
            create: groupIds.map((groupId) => ({ groupId })),
          },
          interests: {
            create: interestIds.map((interestId) => ({ interestId })),
          },
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          contactId: contact.id,
          status: SubscriptionStatus.SUBSCRIBED,
          subscribedAt: new Date(),
          source: 'WEB_FORM',
          events: {
            create: {
              type: 'SUBSCRIBED',
              source: 'WEB_FORM',
            },
          },
        },
      });

      return { message: 'Inscrição realizada com sucesso.' };
    });
  }

 async importFromExcel(fileBuffer: Buffer, userId: string) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows || rows.length === 0) {
        throw new BadRequestException('A planilha está vazia.');
      }

      let importedCount = 0;
      let errorsCount = 0;
      const errors: string[] = [];

      for (const [index, row] of rows.entries()) {
        const rowNum = index + 2;

        const name = row['Nome'] || row['name'];
        const emailInput = row['Email'] || row['email'] || row['E-mail'];
        const phone = row['Telefone'] ? String(row['Telefone']).trim() : null;
        const document = row['CPF/CNPJ'] || row['Documento'] ? String(row['CPF/CNPJ'] || row['Documento']).trim() : null;
        const countryRegion = row['País/Região'] ? String(row['País/Região']).trim() : null;
        const city = row['Cidade'] ? String(row['Cidade']).trim() : null;
        const sector = row['Setor'] ? String(row['Setor']).trim() : null;
        const company = row['Nome da empresa'] ? String(row['Nome da empresa']).trim() : null;
        const originStr = (row['Origem'] || '').toUpperCase().trim();
        const occupation = row['Ocupação'] || null;
        const commercialActivity = row['Atividade comercial'] || null;
        const nextStep = row['Próximo passo'] || null;
        const observations = row['Observações'] || null;
        const notes = row['Notas'] ? String(row['Notas']).trim() : null;
        const interestsRaw = row['Interesses'] ? String(row['Interesses']).trim() : '';
        const lastActivityRaw = row['Data da última atividade'];

        if (!name) {
          errorsCount++;
          errors.push(`Linha ${rowNum}: O campo 'Nome' é obrigatório.`);
          continue;
        }

        // Tratamento do E-mail (Opcional com fallback para evitar Null Constraint)
        const normalizedEmail = emailInput
          ? String(emailInput).toLowerCase().trim()
          : `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@zeit.local`;

        // Mapeamento de Origem
        let origin: LeadOrigin = LeadOrigin.OTHER;
        if (originStr.includes('INSTAGRAM')) origin = LeadOrigin.INSTAGRAM;
        else if (originStr.includes('WHATSAPP')) origin = LeadOrigin.WHATSAPP;

        // Tratamento de Data da Última Atividade (se houver)
        let lastContactAt: Date | null = null;
        if (lastActivityRaw) {
          const parsedDate = new Date(lastActivityRaw);
          if (!isNaN(parsedDate.getTime())) {
            lastContactAt = parsedDate;
          }
        }

        // Concatena descrições comerciais caso existam
        const descParts: string[] = [];
        if (commercialActivity) descParts.push(`Atividade: ${commercialActivity}`);
        if (observations) descParts.push(`Obs: ${observations}`);
        const combinedDescription = descParts.join(' | ');

        // Processa interesses separados por ponto e vírgula (ex: "Qualis;Nira;NPK")
        const interestNames = interestsRaw
          ? interestsRaw.split(';').map((i: string) => i.trim()).filter((i: string) => i.length > 0)
          : [];

        try {
          // Busca contato existente por Email (se fornecido), Telefone ou Nome/Empresa
          let existingContact: any = null;
          if (emailInput) {
            existingContact = await this.prisma.contact.findUnique({ where: { email: normalizedEmail } });
          }
          if (!existingContact && phone) {
            existingContact = await this.prisma.contact.findFirst({ where: { phone } });
          }
          if (!existingContact) {
            existingContact = await this.prisma.contact.findFirst({ where: { name, createdById: userId } });
          }

          // Prepara IDs dos interesses (cria se não existirem no banco)
          const interestConnectOrCreate: { interestId: string }[] = [];
          for (const intName of interestNames) {
            // Garante que o interesse existe na tabela Interest
            const interestRecord = await this.prisma.interest.upsert({
              where: { name: intName },
              update: {},
              create: { name: intName },
            });
            interestConnectOrCreate.push({ interestId: interestRecord.id });
          }

          if (existingContact) {
            // Atualiza contato existente com os novos dados
            await this.prisma.contact.update({
              where: { id: existingContact.id },
              data: {
                ...(emailInput && { email: normalizedEmail }),
                phone,
                document,
                uf: countryRegion,
                city,
                sector,
                company,
                origin,
                profile: occupation,
                proposalNotes: nextStep,
                description: combinedDescription || existingContact.description,
                notes: notes || existingContact.notes,
                lastContactAt,
                interests: {
                  deleteMany: {}, // Limpa antigos e recria com os novos da planilha
                  create: interestConnectOrCreate,
                },
              },
            });
          } else {
            // Cria novo lead e sua Subscription vinculada via transação
            await this.prisma.$transaction(async (tx) => {
              const newContact = await tx.contact.create({
                data: {
                  name,
                  email: normalizedEmail,
                  phone,
                  document,
                  uf: countryRegion,
                  city,
                  sector,
                  company,
                  origin,
                  profile: occupation,
                  proposalNotes: nextStep,
                  description: combinedDescription,
                  notes,
                  lastContactAt,
                  createdById: userId,
                  funnelStage: FunnelStage.FIRST_CONTACT,
                  interests: {
                    create: interestConnectOrCreate,
                  },
                },
              });

              // Cria a subscription padrão
              await tx.subscription.create({
                data: {
                  contactId: newContact.id,
                  status: SubscriptionStatus.SUBSCRIBED,
                  subscribedAt: new Date(),
                  source: 'EXCEL_IMPORT',
                  events: {
                    create: {
                      type: 'SUBSCRIBED',
                      source: 'EXCEL_IMPORT',
                    },
                  },
                },
              });
            });
          }
          importedCount++;
        } catch (dbErr: any) {
          errorsCount++;
          console.error(`Erro na linha ${rowNum} (${name}):`, dbErr.message);
          errors.push(`Linha ${rowNum} (${name}): ${dbErr.message || 'Erro ao persistir no banco.'}`);
        }
      }

      return {
        message: 'Importação concluída com sucesso.',
        importedCount,
        errorsCount,
        errors,
      };
    } catch (err: any) {
      console.error('Erro geral ao ler planilha:', err);
      throw new BadRequestException('Erro ao ler a planilha. Verifique se o formato está correto.');
    }
  }
}