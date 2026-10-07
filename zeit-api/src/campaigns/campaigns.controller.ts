import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SendTestDto } from './dto/send-test.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto, @Request() req) {
    return this.campaignsService.create(dto, req.user.id);
  }

  @Get()
  findAll() {
    return this.campaignsService.findAll();
  }

  @Post(':id/test')
  sendTest(@Param('id') id: string, @Body() dto: SendTestDto) {
    return this.campaignsService.sendTest(id, dto.email);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/send')
  triggerCampaign(
    @Param('id') id: string,
    @Body() body: { groupIds?: string[]; interestIds?: string[] },
  ) {
    return this.campaignsService.triggerCampaign(id, body.groupIds, body.interestIds);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }
}