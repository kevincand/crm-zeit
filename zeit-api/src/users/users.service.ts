import { Injectable, ConflictException, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { UserRole } from '../../generated/prisma/client.ts';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async createUser(data: { name: string; email: string; password: string; role?: UserRole }) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existingUser = await this.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const passwordHash = await argon2.hash(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        passwordHash,
        role: data.role ?? UserRole.MARKETING,
      },
    });

    // Remove o hash de senha antes de retornar
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  async updateRoleOrStatus(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.email == 'admin@zeit.com.br') throw new UnauthorizedException('Ação não permitida.')

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role && { role: dto.role }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
  }

  async updatePassword(targetUserId: string, newPassword: string) {

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso.' };
  }
}