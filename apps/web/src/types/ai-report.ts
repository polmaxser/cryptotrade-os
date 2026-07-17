export type AiReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type AiReport = {
  id: string;
  type: AiReportType;
  title: string;
  summary: string;
  metrics: Record<string, unknown>;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  userId: string;
};
