import type {
  CreateDeFiPositionPayload,
  DeFiPosition,
  UpdateDeFiPositionPayload,
} from '@/types/defi-position';
import { apiFetch } from './client';

export async function fetchDeFiPositions(): Promise<DeFiPosition[]> {
  return apiFetch<DeFiPosition[]>('/defi-positions');
}

export async function createDeFiPosition(
  payload: CreateDeFiPositionPayload,
): Promise<DeFiPosition> {
  return apiFetch<DeFiPosition>('/defi-positions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDeFiPosition(
  id: string,
  payload: UpdateDeFiPositionPayload,
): Promise<DeFiPosition> {
  return apiFetch<DeFiPosition>(`/defi-positions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDeFiPosition(id: string): Promise<void> {
  await apiFetch(`/defi-positions/${id}`, { method: 'DELETE' });
}
