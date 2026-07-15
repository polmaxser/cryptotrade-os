import { SubscriptionPlan, SubscriptionStatus } from '@cryptotrade/database';

import { PlanLimits } from './plan-config';

export interface SubscriptionUsage {
  portfolios: number;
  tradesThisMonth: number;
}

export interface SubscriptionSummary {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hasBillingAccount: boolean;
  limits: PlanLimits;
  usage: SubscriptionUsage;
}
