import { WorkspaceRole } from '@cryptotrade/database';

export interface InvitationPreview {
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  invitedByName: string | null;
  invitedByEmail: string;
  email: string;
  expired: boolean;
}
