'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStrategies } from '@/lib/api/strategies';
import { QUERY_KEYS } from '@/lib/constants';

export function useStrategiesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.strategies,
    queryFn: fetchStrategies,
  });
}
