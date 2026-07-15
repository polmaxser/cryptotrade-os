'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchExchangeConnections } from '@/lib/api/exchanges';
import { QUERY_KEYS } from '@/lib/constants';

export function useExchangeConnectionsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.exchangeConnections,
    queryFn: fetchExchangeConnections,
  });
}
