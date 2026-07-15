'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJournalTags } from '@/lib/api/journal';
import { QUERY_KEYS } from '@/lib/constants';
import type { JournalTagCategory } from '@/types/journal';

export function useJournalTagsQuery(category?: JournalTagCategory) {
  return useQuery({
    queryKey: QUERY_KEYS.journalTags(category),
    queryFn: () => fetchJournalTags(category),
  });
}
