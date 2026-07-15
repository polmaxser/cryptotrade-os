'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMySubscription } from '@/lib/api/billing';
import { QUERY_KEYS } from '@/lib/constants';

export function useSubscriptionQuery(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.subscription,
    queryFn: fetchMySubscription,
    enabled,
  });
}
