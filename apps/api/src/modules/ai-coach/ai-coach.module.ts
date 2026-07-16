import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { TradesModule } from '@/modules/trades/trades.module';
import { JournalModule } from '@/modules/journal/journal.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { AiCoachController } from './ai-coach.controller';
import { CoachInsightsService } from './coach-insights.service';
import { PatternDetectorService } from './pattern-detector.service';
import { CoachLlmService } from './coach-llm.service';
import { CoachInsightRepository } from './repositories/coach-insight.repository';

@Module({
  imports: [DatabaseModule, TradesModule, JournalModule, BillingModule],

  controllers: [AiCoachController],

  providers: [
    CoachInsightsService,
    PatternDetectorService,
    CoachLlmService,
    CoachInsightRepository,
  ],

  exports: [CoachInsightsService],
})
export class AiCoachModule {}
