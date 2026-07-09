'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { getApiUrl } from '@/lib/utils';

type HealthResponse = {
  status: string;
  timestamp: string;
};

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(getApiUrl('/health'));

  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json() as Promise<HealthResponse>;
}

export function useHealthQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: fetchHealth,
    retry: false,
  });
}
