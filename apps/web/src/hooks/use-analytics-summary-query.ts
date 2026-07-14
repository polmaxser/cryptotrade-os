'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary } from '@/lib/api/analytics';
import { QUERY_KEYS } from '@/lib/constants';

export function useAnalyticsSummaryQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.analyticsSummary,
    queryFn: fetchAnalyticsSummary,
  });
}
