import type {
  AdminUserSummary,
  CreatePromoCodePayload,
  ListUsersParams,
  Paginated,
  PromoCode,
} from '@/types/admin';
import type {
  CreateEconomicEventPayload,
  EconomicEvent,
  ListEconomicEventsParams,
  UpdateEconomicEventPayload,
} from '@/types/economic-event';
import { apiFetch } from './client';

export async function fetchAdminUsers(
  params: ListUsersParams,
): Promise<Paginated<AdminUserSummary>> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  return apiFetch<Paginated<AdminUserSummary>>(`/admin/users?${query.toString()}`);
}

export async function setAdminUserStatus(
  userId: string,
  isActive: boolean,
): Promise<AdminUserSummary> {
  return apiFetch<AdminUserSummary>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchAdminPromoCodes(): Promise<PromoCode[]> {
  return apiFetch<PromoCode[]>('/admin/promo-codes');
}

export async function createAdminPromoCode(payload: CreatePromoCodePayload): Promise<PromoCode> {
  return apiFetch<PromoCode>('/admin/promo-codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function setAdminPromoCodeActive(id: string, isActive: boolean): Promise<PromoCode> {
  return apiFetch<PromoCode>(`/admin/promo-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchAdminEconomicEvents(
  params: ListEconomicEventsParams,
): Promise<EconomicEvent[]> {
  const query = new URLSearchParams({ from: params.from, to: params.to });
  if (params.category) query.set('category', params.category);

  return apiFetch<EconomicEvent[]>(`/admin/economic-events?${query.toString()}`);
}

export async function createAdminEconomicEvent(
  payload: CreateEconomicEventPayload,
): Promise<EconomicEvent> {
  return apiFetch<EconomicEvent>('/admin/economic-events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminEconomicEvent(
  id: string,
  payload: UpdateEconomicEventPayload,
): Promise<EconomicEvent> {
  return apiFetch<EconomicEvent>(`/admin/economic-events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminEconomicEvent(id: string): Promise<void> {
  await apiFetch(`/admin/economic-events/${id}`, { method: 'DELETE' });
}
