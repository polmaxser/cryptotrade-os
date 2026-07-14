import { Injectable } from '@nestjs/common';
import { Prisma, Workspace, WorkspaceMember, WorkspaceRole } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

const MEMBER_USER_SELECT = {
  select: {
    id: true,
    email: true,
    name: true,
    avatarUrl: true,
  },
} as const;

export type WorkspaceMemberWithUser = WorkspaceMember & {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.WorkspaceUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Workspace> {
    return (tx ?? this.prisma).workspace.create({
      data,
    });
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({
      where: {
        id,
      },
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({
      where: {
        slug,
      },
    });
  }

  async findAllForUser(userId: string): Promise<Array<Workspace & { role: WorkspaceRole }>> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
      },
      include: {
        workspace: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return memberships.map((membership) => ({
      ...membership.workspace,
      role: membership.role,
    }));
  }

  async update(id: string, data: Prisma.WorkspaceUncheckedUpdateInput): Promise<Workspace> {
    return this.prisma.workspace.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string): Promise<Workspace> {
    return this.prisma.workspace.delete({
      where: {
        id,
      },
    });
  }

  async findMembership(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }

  async findMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: MEMBER_USER_SELECT,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findMemberById(
    workspaceId: string,
    memberId: string,
  ): Promise<WorkspaceMemberWithUser | null> {
    return this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      include: {
        user: MEMBER_USER_SELECT,
      },
    });
  }

  async countOwners(workspaceId: string): Promise<number> {
    return this.prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: 'OWNER',
      },
    });
  }

  async createMember(
    data: Prisma.WorkspaceMemberUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<WorkspaceMember> {
    return (tx ?? this.prisma).workspaceMember.create({
      data,
    });
  }

  async updateMemberRole(memberId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.update({
      where: {
        id: memberId,
      },
      data: {
        role,
      },
    });
  }

  async deleteMember(memberId: string): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.delete({
      where: {
        id: memberId,
      },
    });
  }
}
