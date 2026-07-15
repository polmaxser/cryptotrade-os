'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAlerts } from '@/lib/api/alerts';
import { QUERY_KEYS } from '@/lib/constants';

export function useAlertsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.alerts,
    queryFn: fetchAlerts,
    refetchInterval: 60_000,
  });
}
