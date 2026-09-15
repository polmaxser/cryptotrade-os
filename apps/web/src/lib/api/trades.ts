import type { CreateTradePayload, Trade, UpdateTradePayload } from '@/types/trade';
import type { Paginated } from '@/types/pagination';
import { apiFetch } from './client';

export type ListTradesParams = {
  page?: number;
  pageSize?: number;
};

export async function fetchTrades(params: ListTradesParams = {}): Promise<Paginated<Trade>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  return apiFetch<Paginated<Trade>>(`/trades?${query.toString()}`);
}

export async function createTrade(payload: CreateTradePayload): Promise<Trade> {
  return apiFetch<Trade>('/trades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTrade(id: string, payload: UpdateTradePayload): Promise<Trade> {
  return apiFetch<Trade>(`/trades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTrade(id: string): Promise<void> {
  await apiFetch(`/trades/${id}`, { method: 'DELETE' });
}
