import { QueueEventsHost, QueueEventsListener } from '@nestjs/bullmq';

import { REPORT_GENERATION_QUEUE } from './report-generation.types';

/** Same rationale as CoachQueueEventsListener — lets `generateNow` await its own job. */
@QueueEventsListener(REPORT_GENERATION_QUEUE)
export class ReportQueueEventsListener extends QueueEventsHost {}
