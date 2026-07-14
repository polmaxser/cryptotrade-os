'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInvitationPreview } from '@/lib/api/workspaces';
import { QUERY_KEYS } from '@/lib/constants';

export function useInvitationPreviewQuery(token: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitationPreview(token),
    queryFn: () => fetchInvitationPreview(token),
    retry: false,
  });
}
