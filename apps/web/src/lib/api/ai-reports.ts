import type { AiReport, AiReportType } from '@/types/ai-report';
import { apiFetch } from './client';

export async function fetchAiReports(type?: AiReportType): Promise<AiReport[]> {
  const query = type ? `?type=${type}` : '';
  return apiFetch<AiReport[]>(`/ai-reports${query}`);
}

export async function generateAiReport(type: AiReportType): Promise<AiReport> {
  return apiFetch<AiReport>('/ai-reports/generate', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}
