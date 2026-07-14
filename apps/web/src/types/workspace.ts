export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  role: WorkspaceRole;
};

export type WorkspaceMember = {
  id: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export type WorkspaceInvitation = {
  id: string;
  email: string;
  role: WorkspaceRole;
  workspaceId: string;
  invitedByUserId: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  workspace: { id: string; name: string; slug: string };
  invitedBy: { id: string; name: string | null; email: string };
};

export type CreatedInvitation = {
  invitation: WorkspaceInvitation;
  token: string;
};

export type InvitationPreview = {
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  invitedByName: string | null;
  invitedByEmail: string;
  email: string;
  expired: boolean;
};

export type CreateWorkspacePayload = {
  name: string;
  slug?: string;
  description?: string;
};

export type UpdateWorkspacePayload = Partial<CreateWorkspacePayload>;

export type InviteMemberPayload = {
  email: string;
  role?: WorkspaceRole;
};

/** Roles that can be granted via invite/role-change — OWNER is excluded. */
export const INVITABLE_ROLES: WorkspaceRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];
