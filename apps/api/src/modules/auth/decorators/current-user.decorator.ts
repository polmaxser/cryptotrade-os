import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { PublicUser } from '@/modules/users/types/public-user';

import { AuthenticatedRequest } from '../types/authenticated-request';

export const CurrentUser = createParamDecorator(
  (data: keyof PublicUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return data ? request.user[data] : request.user;
  },
);
