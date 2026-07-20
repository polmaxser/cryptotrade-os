'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminUsers } from '@/lib/api/admin';
import { QUERY_KEYS } from '@/lib/constants';

export function useAdminUsersQuery(search: string, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.adminUsers(search, page),
    queryFn: () => fetchAdminUsers({ search: search || undefined, page }),
  });
}
