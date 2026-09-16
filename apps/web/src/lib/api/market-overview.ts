import type { MarketOverviewSnapshot } from '@/types/market-overview';
import { apiFetch } from './client';

export async function fetchMarketOverview(): Promise<MarketOverviewSnapshot> {
  return apiFetch<MarketOverviewSnapshot>('/market-overview');
}
