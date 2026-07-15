import type { CreatePriceAlertPayload, PriceAlert } from '@/types/alert';
import { apiFetch } from './client';

export async function fetchAlerts(): Promise<PriceAlert[]> {
  return apiFetch<PriceAlert[]>('/alerts');
}

export async function createAlert(payload: CreatePriceAlertPayload): Promise<PriceAlert> {
  return apiFetch<PriceAlert>('/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function removeAlert(id: string): Promise<void> {
  await apiFetch(`/alerts/${id}`, { method: 'DELETE' });
}
