'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStrategyPerformance } from '@/lib/api/strategies';
import { QUERY_KEYS } from '@/lib/constants';

/** `enabled` defaults to false — performance is fetched lazily when a strategy card is expanded. */
export function useStrategyPerformanceQuery(id: string, enabled = false) {
  return useQuery({
    queryKey: QUERY_KEYS.strategyPerformance(id),
    queryFn: () => fetchStrategyPerformance(id),
    enabled,
  });
}
