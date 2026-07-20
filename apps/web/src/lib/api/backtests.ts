import type { BacktestRun, RunBacktestPayload } from '@/types/backtest';
import { apiFetch } from './client';

export async function fetchBacktestRuns(): Promise<BacktestRun[]> {
  return apiFetch<BacktestRun[]>('/backtests');
}

export async function fetchBacktestRun(id: string): Promise<BacktestRun> {
  return apiFetch<BacktestRun>(`/backtests/${id}`);
}

export async function runBacktest(payload: RunBacktestPayload): Promise<BacktestRun> {
  return apiFetch<BacktestRun>('/backtests/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
