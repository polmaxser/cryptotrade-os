'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAiReports } from '@/lib/api/ai-reports';
import { QUERY_KEYS } from '@/lib/constants';
import type { AiReportType } from '@/types/ai-report';

export function useAiReportsQuery(type?: AiReportType) {
  return useQuery({
    queryKey: QUERY_KEYS.aiReports(type),
    queryFn: () => fetchAiReports(type),
  });
}
