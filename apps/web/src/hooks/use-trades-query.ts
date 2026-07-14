'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTrades } from '@/lib/api/trades';
import { QUERY_KEYS } from '@/lib/constants';

export function useTradesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.trades,
    queryFn: fetchTrades,
  });
}
