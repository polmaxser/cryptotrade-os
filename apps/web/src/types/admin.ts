import type { PaidPlan, SubscriptionPlan } from './billing';

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  isAdmin: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  plan: SubscriptionPlan | null;
  subscriptionStatus: string | null;
};

export type ListUsersParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  grantsPlan: SubscriptionPlan;
  freeDays: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePromoCodePayload = {
  code: string;
  description?: string;
  grantsPlan: PaidPlan;
  freeDays: number;
  maxRedemptions?: number;
  expiresAt?: string;
};
