import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '@/common/database/database.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AiCoachModule } from '@/modules/ai-coach/ai-coach.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { AiReportsController } from './ai-reports.controller';
import { AiReportsService } from './ai-reports.service';
import { ReportLlmService } from './report-llm.service';
import { AiReportRepository } from './repositories/ai-report.repository';
import { ReportGenerationProcessor } from './report-generation.processor';
import { REPORT_GENERATION_QUEUE } from './report-generation.types';
import { ReportQueueEventsListener } from './report-queue-events.listener';

@Module({
  imports: [
    DatabaseModule,
    AnalyticsModule,
    AiCoachModule,
    BillingModule,
    BullModule.registerQueue({ name: REPORT_GENERATION_QUEUE }),
  ],

  controllers: [AiReportsController],

  providers: [
    AiReportsService,
    ReportLlmService,
    AiReportRepository,
    ReportGenerationProcessor,
    ReportQueueEventsListener,
  ],

  exports: [AiReportsService],
})
export class AiReportsModule {}
