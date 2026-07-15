'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary } from '@/lib/api/analytics';
import { QUERY_KEYS } from '@/lib/constants';

export function useAnalyticsSummaryQuery(portfolioId?: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.analyticsSummary(portfolioId),
    queryFn: () => fetchAnalyticsSummary(portfolioId),
    enabled,
  });
}
