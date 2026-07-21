'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchExchangeBalance } from '@/lib/api/exchanges';
import { QUERY_KEYS } from '@/lib/constants';

export function useExchangeBalanceQuery(connectionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exchangeBalance(connectionId),
    queryFn: () => fetchExchangeBalance(connectionId),
    staleTime: 60_000,
    retry: false,
  });
}
