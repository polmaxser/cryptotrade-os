import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type PublicUser } from '@/modules/users/types/public-user';

import { type AuthenticatedRequest } from '../types/authenticated-request';

export const CurrentUser = createParamDecorator(
  (data: keyof PublicUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return data ? request.user[data] : request.user;
  },
);
