import type {
  CreateExchangeConnectionPayload,
  ExchangeConnection,
  ImportResult,
  ImportTradesPayload,
} from '@/types/exchange';
import { apiFetch } from './client';

export async function fetchExchangeConnections(): Promise<ExchangeConnection[]> {
  return apiFetch<ExchangeConnection[]>('/exchanges/connections');
}

export async function createExchangeConnection(
  payload: CreateExchangeConnectionPayload,
): Promise<ExchangeConnection> {
  return apiFetch<ExchangeConnection>('/exchanges/connections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteExchangeConnection(id: string): Promise<void> {
  await apiFetch(`/exchanges/connections/${id}`, { method: 'DELETE' });
}

export async function importTrades(
  id: string,
  payload: ImportTradesPayload,
): Promise<ImportResult[]> {
  return apiFetch<ImportResult[]>(`/exchanges/connections/${id}/import`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchExchangeBalance(id: string): Promise<{ balanceUsd: number }> {
  return apiFetch<{ balanceUsd: number }>(`/exchanges/connections/${id}/balance`);
}
