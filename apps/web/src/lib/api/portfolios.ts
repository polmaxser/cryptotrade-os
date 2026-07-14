import type { Portfolio } from '@/types/portfolio';
import { apiFetch } from './client';

export async function fetchPortfolios(): Promise<Portfolio[]> {
  return apiFetch<Portfolio[]>('/portfolios');
}
