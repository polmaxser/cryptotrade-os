import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '@/common/database/database.module';
import { TradesModule } from '@/modules/trades/trades.module';
import { JournalModule } from '@/modules/journal/journal.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { AiCoachController } from './ai-coach.controller';
import { CoachInsightsService } from './coach-insights.service';
import { PatternDetectorService } from './pattern-detector.service';
import { CoachLlmService } from './coach-llm.service';
import { CoachInsightRepository } from './repositories/coach-insight.repository';
import { CoachDetectionProcessor } from './coach-detection.processor';
import { COACH_DETECTION_QUEUE } from './coach-detection.types';
import { CoachQueueEventsListener } from './coach-queue-events.listener';

@Module({
  imports: [
    DatabaseModule,
    TradesModule,
    JournalModule,
    BillingModule,
    BullModule.registerQueue({ name: COACH_DETECTION_QUEUE }),
  ],

  controllers: [AiCoachController],

  providers: [
    CoachInsightsService,
    PatternDetectorService,
    CoachLlmService,
    CoachInsightRepository,
    CoachDetectionProcessor,
    CoachQueueEventsListener,
  ],

  exports: [CoachInsightsService, CoachInsightRepository],
})
export class AiCoachModule {}
