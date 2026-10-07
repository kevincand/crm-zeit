import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post() // <-- O decorator @Post() deve estar configurado
  create(@Body() body: { name: string; description?: string }) {
    return this.groupsService.create(body);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }
}