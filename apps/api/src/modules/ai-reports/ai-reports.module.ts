import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AiCoachModule } from '@/modules/ai-coach/ai-coach.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { AiReportsController } from './ai-reports.controller';
import { AiReportsService } from './ai-reports.service';
import { ReportLlmService } from './report-llm.service';
import { AiReportRepository } from './repositories/ai-report.repository';

@Module({
  imports: [DatabaseModule, AnalyticsModule, AiCoachModule, BillingModule],

  controllers: [AiReportsController],

  providers: [AiReportsService, ReportLlmService, AiReportRepository],

  exports: [AiReportsService],
})
export class AiReportsModule {}
