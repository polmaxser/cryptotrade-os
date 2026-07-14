import { Injectable } from '@nestjs/common';
import { Prisma, WorkspaceInvitation } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

export type InvitationWithContext = WorkspaceInvitation & {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  invitedBy: {
    id: string;
    name: string | null;
    email: string;
  };
};

const WITH_CONTEXT = {
  include: {
    workspace: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    invitedBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
} as const;

@Injectable()
export class WorkspaceInvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.WorkspaceInvitationUncheckedCreateInput): Promise<WorkspaceInvitation> {
    return this.prisma.workspaceInvitation.create({
      data,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<InvitationWithContext | null> {
    return this.prisma.workspaceInvitation.findUnique({
      where: {
        tokenHash,
      },
      ...WITH_CONTEXT,
    });
  }

  async findPendingForWorkspace(workspaceId: string): Promise<InvitationWithContext[]> {
    return this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...WITH_CONTEXT,
    });
  }

  async findPendingForWorkspaceAndEmail(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceInvitation | null> {
    return this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
        revokedAt: null,
      },
    });
  }

  async findById(id: string): Promise<WorkspaceInvitation | null> {
    return this.prisma.workspaceInvitation.findUnique({
      where: {
        id,
      },
    });
  }

  async markAccepted(id: string): Promise<WorkspaceInvitation> {
    return this.prisma.workspaceInvitation.update({
      where: {
        id,
      },
      data: {
        acceptedAt: new Date(),
      },
    });
  }

  async revoke(id: string): Promise<WorkspaceInvitation> {
    return this.prisma.workspaceInvitation.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
