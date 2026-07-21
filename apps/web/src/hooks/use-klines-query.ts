'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchKlines } from '@/lib/api/market-data';
import { QUERY_KEYS } from '@/lib/constants';

export function useKlinesQuery(symbol: string, timeframe: string, from: string, to: string) {
  return useQuery({
    queryKey: QUERY_KEYS.klines(symbol, timeframe, from, to),
    queryFn: () => fetchKlines(symbol, timeframe, from, to),
    enabled: symbol.trim().length > 0,
    staleTime: 30_000,
  });
}
