import { Controller, Get, Query } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsSummary } from './types/analytics-summary';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(
    @CurrentUser('id') userId: string,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary(userId, query.portfolioId);
  }
}
