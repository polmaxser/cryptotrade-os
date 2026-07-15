import type { Portfolio, UpdatePortfolioPayload } from '@/types/portfolio';
import { apiFetch } from './client';

export async function fetchPortfolios(): Promise<Portfolio[]> {
  return apiFetch<Portfolio[]>('/portfolios');
}

export async function updatePortfolio(
  id: string,
  payload: UpdatePortfolioPayload,
): Promise<Portfolio> {
  return apiFetch<Portfolio>(`/portfolios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
