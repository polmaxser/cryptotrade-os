'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminEconomicEvents } from '@/lib/api/admin';
import { QUERY_KEYS } from '@/lib/constants';
import type { EconomicEventCategory } from '@/types/economic-event';

export function useAdminEconomicEventsQuery(
  from: string,
  to: string,
  category?: EconomicEventCategory,
) {
  return useQuery({
    queryKey: QUERY_KEYS.adminEconomicEvents(from, to, category),
    queryFn: () => fetchAdminEconomicEvents({ from, to, category }),
  });
}
