'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWorkspace, fetchWorkspaceMembers } from '@/lib/api/workspaces';
import { QUERY_KEYS } from '@/lib/constants';

export function useWorkspaceQuery(workspaceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.workspace(workspaceId),
    queryFn: () => fetchWorkspace(workspaceId),
  });
}

export function useWorkspaceMembersQuery(workspaceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.workspaceMembers(workspaceId),
    queryFn: () => fetchWorkspaceMembers(workspaceId),
  });
}
