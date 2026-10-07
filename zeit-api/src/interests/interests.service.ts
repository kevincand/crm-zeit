import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterestsService {
  constructor(private prisma: PrismaService) { }

  async create(data: { name: string; description?: string }) {
    const existingInterest = await this.prisma.interest.findUnique({ where: { name: data.name } });
    if (existingInterest) throw new ConflictException('Interesse com este nome já existe.');

    return this.prisma.interest.create({ data });
  }

  async findAll() {
    return this.prisma.interest.findMany({
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
}        