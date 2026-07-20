import { SubscriptionPlan } from '@cryptotrade/database';

/**
 * Mirrors docs/pricing.md — that file is the source of truth for what's in
 * each tier; this is just its enforceable, typed form. Update both together.
 */
export interface PlanLimits {
  maxPortfolios: number | null;
  maxTradesPerMonth: number | null;
  canUseWorkspace: boolean;
  canUseAiCoach: boolean;
  canUseStrategyBuilder: boolean;
}

export interface PlanDefinition {
  plan: SubscriptionPlan;
  name: string;
  priceMonthlyUsd: number;
  features: string[];
  limits: PlanLimits;
}

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanDefinition> = {
  FREE: {
    plan: SubscriptionPlan.FREE,
    name: 'Free',
    priceMonthlyUsd: 0,
    features: [
      'Authentication (2FA included)',
      '1 portfolio',
      'Manual trades — 30/month',
      'Basic analytics: PnL, Win Rate, ROI',
      'Dashboard',
    ],
    limits: {
      maxPortfolios: 1,
      maxTradesPerMonth: 30,
      canUseWorkspace: false,
      canUseAiCoach: false,
      canUseStrategyBuilder: false,
    },
  },
  STANDARD: {
    plan: SubscriptionPlan.STANDARD,
    name: 'Standard',
    priceMonthlyUsd: 26,
    features: [
      'Everything in Free',
      'Unlimited trades',
      'Multiple portfolios (spot + futures)',
      'Journal (manual)',
      'Advanced Portfolio Analytics',
      'Up to 2 exchange integrations',
      'Calendar, Watchlist, Alerts, Notes',
    ],
    limits: {
      maxPortfolios: null,
      maxTradesPerMonth: null,
      canUseWorkspace: false,
      canUseAiCoach: false,
      canUseStrategyBuilder: false,
    },
  },
  PREMIUM: {
    plan: SubscriptionPlan.PREMIUM,
    name: 'Premium',
    priceMonthlyUsd: 49,
    features: [
      'Everything in Standard',
      'Unlimited exchange integrations',
      'Spot, futures, DeFi, NFT portfolios',
      'AI Coach',
      'Journal with AI analysis',
      'AI Reports (daily/weekly/monthly)',
      'Strategy Builder & Backtesting',
      'Workspace (team collaboration)',
      'Economic Calendar',
    ],
    limits: {
      maxPortfolios: null,
      maxTradesPerMonth: null,
      canUseWorkspace: true,
      canUseAiCoach: true,
      canUseStrategyBuilder: true,
    },
  },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_DEFINITIONS[plan].limits;
}
