'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminPromoCodes } from '@/lib/api/admin';
import { QUERY_KEYS } from '@/lib/constants';

export function useAdminPromoCodesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminPromoCodes,
    queryFn: fetchAdminPromoCodes,
  });
}
