'use client';

import { useQuery } from '@tanstack/react-query';
import { searchCoins } from '@/lib/api/watchlist';
import { QUERY_KEYS } from '@/lib/constants';

export function useCoinSearchQuery(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.coinSearch(query),
    queryFn: () => searchCoins(query),
    enabled: query.trim().length >= 2,
  });
}
