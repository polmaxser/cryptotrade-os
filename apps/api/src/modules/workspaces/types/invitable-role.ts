import { WorkspaceRole } from '@cryptotrade/database';

/**
 * OWNER is intentionally excluded — it's granted automatically to the
 * workspace creator, and ownership transfer is out of scope for now.
 */
export const INVITABLE_ROLES = [
  WorkspaceRole.ADMIN,
  WorkspaceRole.MEMBER,
  WorkspaceRole.VIEWER,
] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];
