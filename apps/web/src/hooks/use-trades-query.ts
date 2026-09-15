'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTrades } from '@/lib/api/trades';
import { QUERY_KEYS } from '@/lib/constants';

const DEFAULT_PAGE_SIZE = 50;

export function useTradesQuery(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: QUERY_KEYS.trades(page, pageSize),
    queryFn: () => fetchTrades({ page, pageSize }),
  });
}
