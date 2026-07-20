import { SubscriptionPlan, SubscriptionStatus } from '@cryptotrade/database';

import { UserWithSubscription } from '@/modules/users/repositories/user.repository';

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  isAdmin: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  plan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
}

export function toAdminUserSummary(user: UserWithSubscription): AdminUserSummary {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    isAdmin: user.isAdmin,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    plan: user.subscription?.plan ?? null,
    subscriptionStatus: user.subscription?.status ?? null,
  };
}
