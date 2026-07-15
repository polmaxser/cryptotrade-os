export type SubscriptionPlan = 'FREE' | 'STANDARD' | 'PREMIUM';

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';

/** Plans that can be purchased via Stripe Checkout — FREE is the default, not a checkout target. */
export type PaidPlan = 'STANDARD' | 'PREMIUM';

export type PlanLimits = {
  maxPortfolios: number | null;
  maxTradesPerMonth: number | null;
  canUseWorkspace: boolean;
};

export type PlanDefinition = {
  plan: SubscriptionPlan;
  name: string;
  priceMonthlyUsd: number;
  features: string[];
  limits: PlanLimits;
};

export type SubscriptionUsage = {
  portfolios: number;
  tradesThisMonth: number;
};

export type SubscriptionSummary = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasBillingAccount: boolean;
  limits: PlanLimits;
  usage: SubscriptionUsage;
};

export type CheckoutSession = {
  url: string;
};
