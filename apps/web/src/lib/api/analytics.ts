import type { AnalyticsSummary } from '@/types/analytics';
import { apiFetch } from './client';

export async function fetchAnalyticsSummary(portfolioId?: string): Promise<AnalyticsSummary> {
  const query = portfolioId ? `?portfolioId=${encodeURIComponent(portfolioId)}` : '';
  return apiFetch<AnalyticsSummary>(`/analytics/summary${query}`);
}
