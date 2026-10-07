import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // Protege todas as rotas deste controller
@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Post()
  create(@Body() body: { name: string; description?: string }) {
    return this.interestsService.create(body);
  }

  @Get()
  findAll() {
    return this.interestsService.findAll();
  }
}