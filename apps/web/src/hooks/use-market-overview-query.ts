'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMarketOverview } from '@/lib/api/market-overview';
import { QUERY_KEYS } from '@/lib/constants';

/** Server-side snapshot is cached for 15 minutes, so refetching more often than that just re-reads the same cached response. */
const STALE_TIME_MS = 5 * 60 * 1000;

export function useMarketOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.marketOverview,
    queryFn: fetchMarketOverview,
    staleTime: STALE_TIME_MS,
  });
}
