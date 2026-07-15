'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJournalEntries } from '@/lib/api/journal';
import { QUERY_KEYS } from '@/lib/constants';
import type { JournalEntryFilters } from '@/types/journal';

export function useJournalEntriesQuery(filters: JournalEntryFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.journalEntries(filters),
    queryFn: () => fetchJournalEntries(filters),
  });
}
