import type { AnalyticsSummary } from '@/types/analytics';
import { apiFetch } from './client';

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>('/analytics/summary');
}
