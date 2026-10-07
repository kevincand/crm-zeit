import { Controller, Post, Get, Body, UseGuards, Patch, Param, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Roles(UserRole.ADMIN)
  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRoleOrStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @Patch(':id/password')
  updatePassword(@Param('id') id: string, @Body() dto: UpdateUserPasswordDto) {
    return this.usersService.updatePassword(id, dto.password);
  }
}