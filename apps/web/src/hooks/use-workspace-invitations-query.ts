'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWorkspaceInvitations } from '@/lib/api/workspaces';
import { QUERY_KEYS } from '@/lib/constants';

export function useWorkspaceInvitationsQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.workspaceInvitations(workspaceId),
    queryFn: () => fetchWorkspaceInvitations(workspaceId),
    enabled,
  });
}
