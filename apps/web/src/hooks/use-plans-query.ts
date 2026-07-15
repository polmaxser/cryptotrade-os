'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPlans } from '@/lib/api/billing';
import { QUERY_KEYS } from '@/lib/constants';

export function usePlansQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.billingPlans,
    queryFn: fetchPlans,
  });
}
