'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchEconomicEvents } from '@/lib/api/economic-calendar';
import { QUERY_KEYS } from '@/lib/constants';
import type { EconomicEventCategory } from '@/types/economic-event';

export function useEconomicEventsQuery(from: string, to: string, category?: EconomicEventCategory) {
  return useQuery({
    queryKey: QUERY_KEYS.economicEvents(from, to, category),
    queryFn: () => fetchEconomicEvents({ from, to, category }),
  });
}
