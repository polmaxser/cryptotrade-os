import { AiReportType } from '@cryptotrade/database';

export const REPORT_GENERATION_QUEUE = 'ai-reports';
export const REPORT_GENERATION_JOB = 'generate';

export interface ReportGenerationJobData {
  userId: string;
  type: AiReportType;
  /** ISO string — job data is serialized to JSON, so a Date wouldn't survive the round trip. */
  reference: string;
}
