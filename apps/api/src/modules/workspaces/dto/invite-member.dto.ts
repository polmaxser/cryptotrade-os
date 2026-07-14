import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { WorkspaceRole } from '@cryptotrade/database';

import { INVITABLE_ROLES } from '../types/invitable-role';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(INVITABLE_ROLES)
  role?: WorkspaceRole;
}
