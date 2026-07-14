'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPortfolios } from '@/lib/api/portfolios';
import { QUERY_KEYS } from '@/lib/constants';

export function usePortfoliosQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.portfolios,
    queryFn: fetchPortfolios,
  });
}
