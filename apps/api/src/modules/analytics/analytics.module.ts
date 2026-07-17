import { Module } from '@nestjs/common';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

import { TradesModule } from '@/modules/trades/trades.module';
import { PortfoliosModule } from '@/modules/portfolios/portfolios.module';

@Module({
  imports: [TradesModule, PortfoliosModule],

  controllers: [AnalyticsController],

  providers: [AnalyticsService],

  exports: [AnalyticsService],
})
export class AnalyticsModule {}
