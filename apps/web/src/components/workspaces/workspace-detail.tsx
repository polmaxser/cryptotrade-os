'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from '@/components/dashboard/dashboard-card';
import { useWorkspaceQuery, useWorkspaceMembersQuery } from '@/hooks/use-workspace-detail-query';
import { useWorkspaceInvitationsQuery } from '@/hooks/use-workspace-invitations-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  deleteWorkspace,
  leaveWorkspace,
  removeMember,
  revokeInvitation,
  updateMemberRole,
} from '@/lib/api/workspaces';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { INVITABLE_ROLES, type WorkspaceRole } from '@/types/workspace';
import { InviteMemberDialog } from './invite-member-dialog';

const MANAGE_ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN'];

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

type WorkspaceDetailProps = {
  workspaceId: string;
};

export function WorkspaceDetail({ workspaceId }: WorkspaceDetailProps) {
  const t = useTranslations('workspaces.detail');
  const tRoles = useTranslations('workspaces.roles');
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const membersQuery = useWorkspaceMembersQuery(workspaceId);

  const canManage = workspaceQuery.data ? MANAGE_ROLES.includes(workspaceQuery.data.role) : false;

  const invitationsQuery = useWorkspaceInvitationsQuery(workspaceId, canManage);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaces });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspace(workspaceId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceMembers(workspaceId) });
  };

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      updateMemberRole(workspaceId, memberId, role),
    onSuccess: invalidateAll,
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(workspaceId, memberId),
    onSuccess: invalidateAll,
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(workspaceId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceInvitations(workspaceId) });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaces });
      router.push('/workspaces');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaces });
      router.push('/workspaces');
    },
  });

  if (workspaceQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <p className="text-muted-foreground py-12 text-center text-sm">{t('notFound')}</p>;
  }

  const workspace = workspaceQuery.data;
  const mutationError = [
    roleMutation,
    removeMutation,
    revokeMutation,
    leaveMutation,
    deleteMutation,
  ]
    .map((m) => m.error)
    .find((error): error is ApiError => error instanceof ApiError);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{workspace.name}</h1>
            <Badge variant="secondary">{tRoles(workspace.role)}</Badge>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">{workspace.slug}</p>
          {workspace.description ? (
            <p className="text-muted-foreground text-sm">{workspace.description}</p>
          ) : null}
        </div>
        {canManage ? <InviteMemberDialog workspaceId={workspaceId} /> : null}
      </div>

      {mutationError ? <p className="text-sm text-red-400">{mutationError.message}</p> : null}

      <DashboardCard>
        <DashboardCardHeader title={t('membersTitle')} />
        <DashboardCardContent className="pt-4">
          <ul className="space-y-3">
            {membersQuery.data?.map((member) => {
              const isSelf = member.user.id === currentUser?.id;

              return (
                <li
                  key={member.id}
                  className="border-border/50 bg-background/30 flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="ring-border/60 h-8 w-8 shrink-0 ring-1">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-xs font-semibold text-violet-200">
                        {getInitials(member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.user.name ?? member.user.email}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {canManage && member.role !== 'OWNER' && !isSelf ? (
                      <select
                        value={member.role}
                        onChange={(event) =>
                          roleMutation.mutate({
                            memberId: member.id,
                            role: event.target.value as WorkspaceRole,
                          })
                        }
                        className="border-input bg-background rounded-md border px-2 py-1 text-xs"
                      >
                        {INVITABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {tRoles(role)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="secondary">{tRoles(member.role)}</Badge>
                    )}

                    {canManage && member.role !== 'OWNER' && !isSelf ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMutation.mutate(member.id)}
                      >
                        {t('remove')}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </DashboardCardContent>
      </DashboardCard>

      {canManage && invitationsQuery.data && invitationsQuery.data.length > 0 ? (
        <DashboardCard>
          <DashboardCardHeader title={t('pendingInvitationsTitle')} />
          <DashboardCardContent className="pt-4">
            <ul className="space-y-3">
              {invitationsQuery.data.map((invitation) => (
                <li
                  key={invitation.id}
                  className="border-border/50 bg-background/30 flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{invitation.email}</p>
                    <p className="text-muted-foreground text-xs">{tRoles(invitation.role)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revokeMutation.mutate(invitation.id)}
                  >
                    {t('revoke')}
                  </Button>
                </li>
              ))}
            </ul>
          </DashboardCardContent>
        </DashboardCard>
      ) : null}

      <div className="flex gap-3">
        {workspace.role === 'OWNER' ? (
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {t('deleteWorkspace')}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
          >
            {t('leaveWorkspace')}
          </Button>
        )}
      </div>
    </div>
  );
}
