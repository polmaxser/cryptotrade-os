import type {
  CreateStrategyPayload,
  Strategy,
  StrategyPerformance,
  UpdateStrategyPayload,
} from '@/types/strategy';
import { apiFetch } from './client';

export async function fetchStrategies(): Promise<Strategy[]> {
  return apiFetch<Strategy[]>('/strategies');
}

export async function createStrategy(payload: CreateStrategyPayload): Promise<Strategy> {
  return apiFetch<Strategy>('/strategies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStrategy(
  id: string,
  payload: UpdateStrategyPayload,
): Promise<Strategy> {
  return apiFetch<Strategy>(`/strategies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteStrategy(id: string): Promise<void> {
  await apiFetch(`/strategies/${id}`, { method: 'DELETE' });
}

export async function fetchStrategyPerformance(id: string): Promise<StrategyPerformance> {
  return apiFetch<StrategyPerformance>(`/strategies/${id}/performance`);
}
