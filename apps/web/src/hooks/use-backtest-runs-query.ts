'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBacktestRuns } from '@/lib/api/backtests';
import { QUERY_KEYS } from '@/lib/constants';

export function useBacktestRunsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.backtestRuns,
    queryFn: fetchBacktestRuns,
  });
}
