import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CoachInsight } from '@cryptotrade/database';

import { CoachInsightsService } from './coach-insights.service';
import { COACH_DETECTION_QUEUE, CoachDetectionJobData } from './coach-detection.types';

/**
 * Concurrency is capped so background (cron) and on-demand ("Analyze Now")
 * runs don't fire an unbounded number of concurrent Anthropic calls once a
 * key is configured — the queue is the one place that now needs to know this.
 */
@Processor(COACH_DETECTION_QUEUE, { concurrency: 2 })
export class CoachDetectionProcessor extends WorkerHost {
  constructor(private readonly coachInsightsService: CoachInsightsService) {
    super();
  }

  async process(job: Job<CoachDetectionJobData>): Promise<CoachInsight[]> {
    return this.coachInsightsService.runDetectionForUser(job.data.userId);
  }
}
