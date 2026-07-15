import { Module } from '@nestjs/common';

import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceInvitationRepository } from './repositories/workspace-invitation.repository';

import { DatabaseModule } from '@/common/database/database.module';
import { UsersModule } from '@/modules/users/users.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [DatabaseModule, UsersModule, BillingModule],

  controllers: [WorkspacesController],

  providers: [WorkspacesService, WorkspaceRepository, WorkspaceInvitationRepository],

  exports: [WorkspacesService, WorkspaceRepository],
})
export class WorkspacesModule {}
