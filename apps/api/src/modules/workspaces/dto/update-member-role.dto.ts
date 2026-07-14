import { IsIn } from 'class-validator';
import { WorkspaceRole } from '@cryptotrade/database';

import { INVITABLE_ROLES } from '../types/invitable-role';

export class UpdateMemberRoleDto {
  @IsIn(INVITABLE_ROLES)
  role!: WorkspaceRole;
}
