'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDeFiPositions } from '@/lib/api/defi-positions';
import { QUERY_KEYS } from '@/lib/constants';

export function useDeFiPositionsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.defiPositions,
    queryFn: fetchDeFiPositions,
  });
}
