import type { Candle } from '@/types/candle';
import { apiFetch } from './client';

export async function fetchKlines(
  symbol: string,
  timeframe: string,
  from: string,
  to: string,
): Promise<Candle[]> {
  const query = new URLSearchParams({ symbol, timeframe, from, to });
  return apiFetch<Candle[]>(`/market-data/klines?${query.toString()}`);
}
