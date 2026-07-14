import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@cryptotrade/database';

import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';

const MANAGE_ROLES = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN];

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.workspacesService.findAllForUser(userId);
  }

  @Public()
  @Get('invitations/:token')
  async previewInvitation(@Param('token') token: string) {
    return this.workspacesService.getInvitationPreview(token);
  }

  @Post('invitations/:token/accept')
  async acceptInvitation(@Param('token') token: string, @CurrentUser('id') userId: string) {
    return this.workspacesService.acceptInvitation(token, userId);
  }

  @Get(':workspaceId')
  async findOne(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    return this.workspacesService.findOne(workspaceId, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(...MANAGE_ROLES)
  @Patch(':workspaceId')
  async update(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(workspaceId, userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.OWNER)
  @Delete(':workspaceId')
  async remove(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    await this.workspacesService.remove(workspaceId, userId);

    return { success: true };
  }

  @Post(':workspaceId/leave')
  async leave(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    await this.workspacesService.leaveWorkspace(workspaceId, userId);

    return { success: true };
  }

  @Get(':workspaceId/members')
  async listMembers(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    return this.workspacesService.listMembers(workspaceId, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(...MANAGE_ROLES)
  @Patch(':workspaceId/members/:memberId')
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, memberId, dto.role, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(...MANAGE_ROLES)
  @Delete(':workspaceId/members/:memberId')
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.workspacesService.removeMember(workspaceId, memberId, userId);

    return { success: true };
  }

  @UseGuards(RolesGuard)
  @Roles(...MANAGE_ROLES)
  @Post(':workspaceId/invitations')
  async inviteMember(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspacesService.inviteMember(workspaceId, userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(...MANAGE_ROLES)
  @Get(':workspaceId/invitations')
  async listInvitations(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.listInvitations(workspaceId, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(...MANAGE_ROLES)
  @Delete(':workspaceId/invitations/:invitationId')
  async revokeInvitation(
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.workspacesService.revokeInvitation(workspaceId, invitationId, userId);

    return { success: true };
  }
}
