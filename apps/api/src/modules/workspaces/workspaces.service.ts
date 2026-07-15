import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceMember, WorkspaceRole } from '@cryptotrade/database';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '@/common/database/prisma.service';
import { UsersService } from '@/modules/users/users.service';
import { BillingService } from '@/modules/billing/billing.service';

import { WorkspaceRepository, WorkspaceMemberWithUser } from './repositories/workspace.repository';
import { WorkspaceInvitationRepository } from './repositories/workspace-invitation.repository';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { WorkspaceWithRole } from './types/workspace-with-role';
import { InvitationPreview } from './types/invitation-preview';
import { PublicInvitation, toPublicInvitation } from './types/public-invitation';

const INVITATION_TTL_DAYS = 7;
const INVITATION_TOKEN_BYTES = 32;

export interface CreatedInvitation {
  invitation: PublicInvitation;
  token: string;
}

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly invitationRepository: WorkspaceInvitationRepository,
    private readonly usersService: UsersService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceWithRole> {
    await this.billingService.assertCanCreateWorkspace(userId);

    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);

    const workspace = await this.prisma.$transaction(async (tx) => {
      const created = await this.workspaceRepository.create(
        {
          name: dto.name,
          slug,
          description: dto.description,
        },
        tx,
      );

      await this.workspaceRepository.createMember(
        {
          workspaceId: created.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
        tx,
      );

      return created;
    });

    return { ...workspace, role: WorkspaceRole.OWNER };
  }

  async findAllForUser(userId: string): Promise<WorkspaceWithRole[]> {
    return this.workspaceRepository.findAllForUser(userId);
  }

  async findOne(workspaceId: string, userId: string): Promise<WorkspaceWithRole> {
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.getMembershipOrThrow(workspaceId, userId);

    return { ...workspace, role: membership.role };
  }

  async update(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceWithRole> {
    const membership = await this.getMembershipOrThrow(workspaceId, userId);

    if (dto.slug) {
      const existing = await this.workspaceRepository.findBySlug(dto.slug);

      if (existing && existing.id !== workspaceId) {
        throw new ConflictException('This slug is already taken');
      }
    }

    const workspace = await this.workspaceRepository.update(workspaceId, dto);

    return { ...workspace, role: membership.role };
  }

  async remove(workspaceId: string, userId: string): Promise<void> {
    await this.getMembershipOrThrow(workspaceId, userId);

    await this.workspaceRepository.delete(workspaceId);
  }

  async listMembers(workspaceId: string, userId: string): Promise<WorkspaceMemberWithUser[]> {
    await this.getMembershipOrThrow(workspaceId, userId);

    return this.workspaceRepository.findMembers(workspaceId);
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: WorkspaceRole,
    actingUserId: string,
  ): Promise<WorkspaceMember> {
    await this.getMembershipOrThrow(workspaceId, actingUserId);

    const member = await this.workspaceRepository.findMemberById(workspaceId, memberId);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === WorkspaceRole.OWNER) {
      await this.assertNotLastOwner(workspaceId, 'Workspace must have at least one owner');
    }

    return this.workspaceRepository.updateMemberRole(memberId, role);
  }

  async removeMember(workspaceId: string, memberId: string, actingUserId: string): Promise<void> {
    await this.getMembershipOrThrow(workspaceId, actingUserId);

    const member = await this.workspaceRepository.findMemberById(workspaceId, memberId);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === WorkspaceRole.OWNER) {
      await this.assertNotLastOwner(workspaceId, 'Cannot remove the only owner of the workspace');
    }

    await this.workspaceRepository.deleteMember(memberId);
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.getMembershipOrThrow(workspaceId, userId);

    if (membership.role === WorkspaceRole.OWNER) {
      await this.assertNotLastOwner(
        workspaceId,
        'Transfer ownership or delete the workspace instead of leaving as the only owner',
      );
    }

    await this.workspaceRepository.deleteMember(membership.id);
  }

  async inviteMember(
    workspaceId: string,
    inviterUserId: string,
    dto: InviteMemberDto,
  ): Promise<CreatedInvitation> {
    await this.getMembershipOrThrow(workspaceId, inviterUserId);

    const email = dto.email.toLowerCase().trim();

    const invitedUser = await this.usersService.findAuthUserByEmail(email);

    if (invitedUser) {
      const existingMembership = await this.workspaceRepository.findMembership(
        workspaceId,
        invitedUser.id,
      );

      if (existingMembership) {
        throw new ConflictException('This person is already a member of the workspace');
      }
    }

    const existingInvite = await this.invitationRepository.findPendingForWorkspaceAndEmail(
      workspaceId,
      email,
    );

    if (existingInvite) {
      throw new ConflictException('An invitation is already pending for this email');
    }

    const rawToken = randomBytes(INVITATION_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.invitationRepository.create({
      email,
      role: dto.role ?? WorkspaceRole.MEMBER,
      tokenHash: this.hashToken(rawToken),
      workspaceId,
      invitedByUserId: inviterUserId,
      expiresAt,
    });

    const invitation = await this.invitationRepository.findByTokenHash(this.hashToken(rawToken));

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return { invitation: toPublicInvitation(invitation), token: rawToken };
  }

  async listInvitations(workspaceId: string, userId: string): Promise<PublicInvitation[]> {
    await this.getMembershipOrThrow(workspaceId, userId);

    const invitations = await this.invitationRepository.findPendingForWorkspace(workspaceId);

    return invitations.map(toPublicInvitation);
  }

  async revokeInvitation(workspaceId: string, invitationId: string, userId: string): Promise<void> {
    await this.getMembershipOrThrow(workspaceId, userId);

    const invitation = await this.invitationRepository.findById(invitationId);

    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitation not found');
    }

    await this.invitationRepository.revoke(invitationId);
  }

  async getInvitationPreview(rawToken: string): Promise<InvitationPreview> {
    const invitation = await this.invitationRepository.findByTokenHash(this.hashToken(rawToken));

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return {
      workspaceName: invitation.workspace.name,
      workspaceSlug: invitation.workspace.slug,
      role: invitation.role,
      invitedByName: invitation.invitedBy.name,
      invitedByEmail: invitation.invitedBy.email,
      email: invitation.email,
      expired: this.isInvitationExpired(invitation),
    };
  }

  async acceptInvitation(rawToken: string, userId: string): Promise<WorkspaceWithRole> {
    const invitation = await this.invitationRepository.findByTokenHash(this.hashToken(rawToken));

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (this.isInvitationExpired(invitation)) {
      throw new ConflictException('This invitation is no longer valid');
    }

    const user = await this.usersService.findAuthUserById(userId);

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    const existingMembership = await this.workspaceRepository.findMembership(
      invitation.workspaceId,
      userId,
    );

    if (!existingMembership) {
      await this.workspaceRepository.createMember({
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      });
    }

    await this.invitationRepository.markAccepted(invitation.id);

    const membership =
      existingMembership ?? (await this.getMembershipOrThrow(invitation.workspaceId, userId));

    return { ...invitation.workspace, role: membership.role } as WorkspaceWithRole;
  }

  private async assertNotLastOwner(workspaceId: string, message: string): Promise<void> {
    const ownerCount = await this.workspaceRepository.countOwners(workspaceId);

    if (ownerCount <= 1) {
      throw new ConflictException(message);
    }
  }

  private isInvitationExpired(invitation: {
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
  }): boolean {
    return (
      Boolean(invitation.revokedAt) ||
      Boolean(invitation.acceptedAt) ||
      invitation.expiresAt < new Date()
    );
  }

  private async getMembershipOrThrow(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember> {
    const membership = await this.workspaceRepository.findMembership(workspaceId, userId);

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }

    return membership;
  }

  private async resolveUniqueSlug(base: string): Promise<string> {
    const slugBase = slugify(base);
    let candidate = slugBase;
    let suffix = 1;

    while (await this.workspaceRepository.findBySlug(candidate)) {
      suffix += 1;
      candidate = `${slugBase}-${suffix}`;
    }

    return candidate;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');

  return slug || 'workspace';
}
