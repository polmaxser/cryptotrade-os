'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCalendarMonth } from '@/lib/api/calendar';
import { QUERY_KEYS } from '@/lib/constants';

export function useCalendarQuery(month: string) {
  return useQuery({
    queryKey: QUERY_KEYS.calendarMonth(month),
    queryFn: () => fetchCalendarMonth(month),
  });
}
