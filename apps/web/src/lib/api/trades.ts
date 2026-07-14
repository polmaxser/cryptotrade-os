import type { Trade } from '@/types/trade';
import { apiFetch } from './client';

export async function fetchTrades(): Promise<Trade[]> {
  return apiFetch<Trade[]>('/trades');
}
