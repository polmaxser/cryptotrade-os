import { Workspace, WorkspaceRole } from '@cryptotrade/database';

export type WorkspaceWithRole = Workspace & {
  role: WorkspaceRole;
};
