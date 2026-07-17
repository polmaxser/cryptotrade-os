'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoachInsightsWidget } from '@/components/coach';
import { useJournalEntriesQuery } from '@/hooks/use-journal-entries-query';
import { useJournalTagsQuery } from '@/hooks/use-journal-tags-query';
import { JournalEntryCard } from './journal-entry-card';
import { JournalEntryDialog } from './journal-entry-dialog';

export function JournalList() {
  const t = useTranslations('journal');

  const [tagId, setTagId] = useState('');
  const entriesQuery = useJournalEntriesQuery({ tagId: tagId || undefined });
  const tagsQuery = useJournalTagsQuery();
  const tags = tagsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <JournalEntryDialog>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newEntry')}
          </Button>
        </JournalEntryDialog>
      </div>

      <CoachInsightsWidget />

      {tags.length > 0 ? (
        <select
          value={tagId}
          onChange={(event) => setTagId(event.target.value)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <option value="">{t('allTags')}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      ) : null}

      {entriesQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : entriesQuery.data && entriesQuery.data.length > 0 ? (
        <div className="space-y-4">
          {entriesQuery.data.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
