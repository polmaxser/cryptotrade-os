import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiReport } from '@cryptotrade/database';

import { AiReportsService } from './ai-reports.service';
import { REPORT_GENERATION_QUEUE, ReportGenerationJobData } from './report-generation.types';

/** Same concurrency-throttling rationale as CoachDetectionProcessor. */
@Processor(REPORT_GENERATION_QUEUE, { concurrency: 2 })
export class ReportGenerationProcessor extends WorkerHost {
  constructor(private readonly aiReportsService: AiReportsService) {
    super();
  }

  async process(job: Job<ReportGenerationJobData>): Promise<AiReport> {
    const { userId, type, reference } = job.data;
    return this.aiReportsService.generateForPeriod(userId, type, new Date(reference));
  }
}
