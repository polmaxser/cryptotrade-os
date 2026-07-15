'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWatchlist } from '@/lib/api/watchlist';
import { QUERY_KEYS } from '@/lib/constants';

export function useWatchlistQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.watchlist,
    queryFn: fetchWatchlist,
    refetchInterval: 30_000,
  });
}
