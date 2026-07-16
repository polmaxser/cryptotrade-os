import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { CoachInsightsService } from './coach-insights.service';
import { ListCoachInsightsDto } from './dto/list-coach-insights.dto';
import { UpdateCoachInsightDto } from './dto/update-coach-insight.dto';

@Controller('ai-coach')
export class AiCoachController {
  constructor(private readonly coachInsightsService: CoachInsightsService) {}

  @Get('insights')
  async listInsights(@CurrentUser('id') userId: string, @Query() query: ListCoachInsightsDto) {
    return this.coachInsightsService.listForUser(userId, query.status);
  }

  @Patch('insights/:id')
  async updateInsight(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCoachInsightDto,
  ) {
    return this.coachInsightsService.updateStatus(id, userId, dto.status);
  }

  @Post('insights/analyze')
  async analyzeNow(@CurrentUser('id') userId: string) {
    return this.coachInsightsService.analyzeNow(userId);
  }
}
