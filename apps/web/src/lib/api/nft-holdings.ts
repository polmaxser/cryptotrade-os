import type {
  CreateNftHoldingPayload,
  NftHolding,
  UpdateNftHoldingPayload,
} from '@/types/nft-holding';
import { apiFetch } from './client';

export async function fetchNftHoldings(): Promise<NftHolding[]> {
  return apiFetch<NftHolding[]>('/nft-holdings');
}

export async function createNftHolding(payload: CreateNftHoldingPayload): Promise<NftHolding> {
  return apiFetch<NftHolding>('/nft-holdings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNftHolding(
  id: string,
  payload: UpdateNftHoldingPayload,
): Promise<NftHolding> {
  return apiFetch<NftHolding>(`/nft-holdings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteNftHolding(id: string): Promise<void> {
  await apiFetch(`/nft-holdings/${id}`, { method: 'DELETE' });
}
