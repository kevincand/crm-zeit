import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) { }

  async create(data: { name: string; description?: string }) {
    const existingGroup = await this.prisma.group.findUnique({ where: { name: data.name } });
    if (existingGroup) throw new ConflictException('Grupo com este nome já existe.');

    return this.prisma.group.create({ data });
  }

  async findAll() {
    return this.prisma.group.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            contacts: {
              where: { contact: { deletedAt: null } }
            }
          }
        }
      },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Grupo não encontrado.');
    return group;
  }
}