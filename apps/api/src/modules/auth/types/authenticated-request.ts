import type { Request } from 'express';

import { PublicUser } from '@/modules/users/types/public-user';

export interface AuthenticatedRequest extends Request {
  user: PublicUser;
}
