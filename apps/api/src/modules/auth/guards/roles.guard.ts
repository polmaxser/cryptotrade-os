import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { type WorkspaceRole } from '@cryptotrade/database';

import { type PrismaService } from '@/common/database/prisma.service';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { type AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawWorkspaceId = request.params?.workspaceId;
    const workspaceId = Array.isArray(rawWorkspaceId) ? rawWorkspaceId[0] : rawWorkspaceId;

    if (!request.user || !workspaceId) {
      throw new ForbiddenException('Workspace context is required');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: request.user.id,
        },
      },
    });

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient workspace role');
    }

    return true;
  }
}
