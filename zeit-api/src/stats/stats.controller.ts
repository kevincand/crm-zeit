import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  getOverview() {
    return this.statsService.getOverview();
  }

  @Get('campaigns/:id')
  getCampaignStats(@Param('id') id: string) {
    return this.statsService.getCampaignStats(id);
  }
}