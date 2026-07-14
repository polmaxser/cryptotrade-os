import type {
  CreatedInvitation,
  CreateWorkspacePayload,
  InvitationPreview,
  InviteMemberPayload,
  UpdateWorkspacePayload,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRole,
} from '@/types/workspace';
import { apiFetch } from './client';

export async function fetchWorkspaces(): Promise<Workspace[]> {
  return apiFetch<Workspace[]>('/workspaces');
}

export async function fetchWorkspace(workspaceId: string): Promise<Workspace> {
  return apiFetch<Workspace>(`/workspaces/${workspaceId}`);
}

export async function createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
  return apiFetch<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateWorkspace(
  workspaceId: string,
  payload: UpdateWorkspacePayload,
): Promise<Workspace> {
  return apiFetch<Workspace>(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await apiFetch(`/workspaces/${workspaceId}`, { method: 'DELETE' });
}

export async function leaveWorkspace(workspaceId: string): Promise<void> {
  await apiFetch(`/workspaces/${workspaceId}/leave`, { method: 'POST' });
}

export async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  return apiFetch<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  return apiFetch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(workspaceId: string, memberId: string): Promise<void> {
  await apiFetch(`/workspaces/${workspaceId}/members/${memberId}`, { method: 'DELETE' });
}

export async function fetchWorkspaceInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitation[]> {
  return apiFetch<WorkspaceInvitation[]>(`/workspaces/${workspaceId}/invitations`);
}

export async function inviteMember(
  workspaceId: string,
  payload: InviteMemberPayload,
): Promise<CreatedInvitation> {
  return apiFetch<CreatedInvitation>(`/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
  await apiFetch(`/workspaces/${workspaceId}/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}

export async function fetchInvitationPreview(token: string): Promise<InvitationPreview> {
  return apiFetch<InvitationPreview>(`/workspaces/invitations/${token}`);
}

export async function acceptInvitation(token: string): Promise<Workspace> {
  return apiFetch<Workspace>(`/workspaces/invitations/${token}/accept`, {
    method: 'POST',
  });
}
