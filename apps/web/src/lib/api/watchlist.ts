import type { AddWatchlistItemPayload, CoinSearchResult, WatchlistItem } from '@/types/watchlist';
import { apiFetch } from './client';

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>('/watchlist');
}

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  return apiFetch<CoinSearchResult[]>(`/watchlist/search?query=${encodeURIComponent(query)}`);
}

export async function addWatchlistItem(payload: AddWatchlistItemPayload): Promise<WatchlistItem> {
  return apiFetch<WatchlistItem>('/watchlist', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function removeWatchlistItem(id: string): Promise<void> {
  await apiFetch(`/watchlist/${id}`, { method: 'DELETE' });
}
