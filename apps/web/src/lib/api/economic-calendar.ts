import type { EconomicEvent, ListEconomicEventsParams } from '@/types/economic-event';
import { apiFetch } from './client';

export async function fetchEconomicEvents(
  params: ListEconomicEventsParams,
): Promise<EconomicEvent[]> {
  const query = new URLSearchParams({ from: params.from, to: params.to });
  if (params.category) query.set('category', params.category);

  return apiFetch<EconomicEvent[]>(`/economic-calendar?${query.toString()}`);
}
