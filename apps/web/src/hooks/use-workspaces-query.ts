'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWorkspaces } from '@/lib/api/workspaces';
import { QUERY_KEYS } from '@/lib/constants';

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.workspaces,
    queryFn: fetchWorkspaces,
  });
}
