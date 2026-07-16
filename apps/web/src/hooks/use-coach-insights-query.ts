'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCoachInsights } from '@/lib/api/coach-insights';
import { QUERY_KEYS } from '@/lib/constants';
import type { CoachInsightStatus } from '@/types/coach-insight';

export function useCoachInsightsQuery(status?: CoachInsightStatus) {
  return useQuery({
    queryKey: QUERY_KEYS.coachInsights(status),
    queryFn: () => fetchCoachInsights(status),
  });
}
