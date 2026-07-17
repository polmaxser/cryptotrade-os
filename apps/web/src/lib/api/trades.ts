import type { CreateTradePayload, Trade, UpdateTradePayload } from '@/types/trade';
import { apiFetch } from './client';

export async function fetchTrades(): Promise<Trade[]> {
  return apiFetch<Trade[]>('/trades');
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
