import type {
  CreateJournalEntryPayload,
  CreateJournalTagPayload,
  JournalEntry,
  JournalEntryFilters,
  JournalTag,
  JournalTagCategory,
  UpdateJournalEntryPayload,
} from '@/types/journal';
import { apiFetch } from './client';

export async function fetchJournalEntries(
  filters: JournalEntryFilters = {},
): Promise<JournalEntry[]> {
  const params = new URLSearchParams();
  if (filters.tradeId) params.set('tradeId', filters.tradeId);
  if (filters.tagId) params.set('tagId', filters.tagId);
  const query = params.toString();

  return apiFetch<JournalEntry[]>(`/journal/entries${query ? `?${query}` : ''}`);
}

export async function fetchJournalEntry(id: string): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`/journal/entries/${id}`);
}

export async function createJournalEntry(
  payload: CreateJournalEntryPayload,
): Promise<JournalEntry> {
  return apiFetch<JournalEntry>('/journal/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateJournalEntry(
  id: string,
  payload: UpdateJournalEntryPayload,
): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`/journal/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await apiFetch(`/journal/entries/${id}`, { method: 'DELETE' });
}

export async function uploadJournalScreenshot(id: string, file: File): Promise<JournalEntry> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<JournalEntry>(`/journal/entries/${id}/screenshots`, {
    method: 'POST',
    body: formData,
  });
}

export async function removeJournalScreenshot(id: string, url: string): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`/journal/entries/${id}/screenshots`, {
    method: 'DELETE',
    body: JSON.stringify({ url }),
  });
}

export async function fetchJournalTags(category?: JournalTagCategory): Promise<JournalTag[]> {
  const query = category ? `?category=${category}` : '';
  return apiFetch<JournalTag[]>(`/journal/tags${query}`);
}

export async function createJournalTag(payload: CreateJournalTagPayload): Promise<JournalTag> {
  return apiFetch<JournalTag>('/journal/tags', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteJournalTag(id: string): Promise<void> {
  await apiFetch(`/journal/tags/${id}`, { method: 'DELETE' });
}
