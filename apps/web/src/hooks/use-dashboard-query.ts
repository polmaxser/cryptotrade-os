'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardData } from '@/types/dashboard';
import { QUERY_KEYS } from '@/lib/constants';
import { getApiUrl } from '@/lib/utils';

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch(getApiUrl('/dashboard'));

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return response.json() as Promise<DashboardData>;
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: fetchDashboard,
    enabled: false,
  });
}
