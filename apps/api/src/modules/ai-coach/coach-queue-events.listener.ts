import { QueueEventsHost, QueueEventsListener } from '@nestjs/bullmq';

import { COACH_DETECTION_QUEUE } from './coach-detection.types';

/**
 * Managed `QueueEvents` connection (Nest opens/closes it with the module) —
 * needed so `analyzeNow` can `job.waitUntilFinished(...)` and return the
 * result synchronously to the caller, same as before the queue existed.
 */
@QueueEventsListener(COACH_DETECTION_QUEUE)
export class CoachQueueEventsListener extends QueueEventsHost {}
