import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';
import { StrategyRepository } from './repositories/strategy.repository';

@Module({
  imports: [DatabaseModule, AnalyticsModule, BillingModule],

  controllers: [StrategiesController],

  providers: [StrategiesService, StrategyRepository],

  exports: [StrategiesService],
})
export class StrategiesModule {}
