import type {
  CheckoutSession,
  PaidPlan,
  PlanDefinition,
  SubscriptionSummary,
} from '@/types/billing';
import { apiFetch } from './client';

export async function fetchPlans(): Promise<PlanDefinition[]> {
  return apiFetch<PlanDefinition[]>('/billing/plans');
}

export async function fetchMySubscription(): Promise<SubscriptionSummary> {
  return apiFetch<SubscriptionSummary>('/billing/subscription');
}

export async function createCheckoutSession(plan: PaidPlan): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export async function createPortalSession(): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/portal', { method: 'POST' });
}

export async function redeemPromoCode(code: string): Promise<SubscriptionSummary> {
  return apiFetch<SubscriptionSummary>('/billing/promo-codes/redeem', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}
