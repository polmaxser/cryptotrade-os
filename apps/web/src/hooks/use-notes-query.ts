'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchNotes } from '@/lib/api/notes';
import { QUERY_KEYS } from '@/lib/constants';

export function useNotesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.notes,
    queryFn: fetchNotes,
  });
}
