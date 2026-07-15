'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { deleteJournalEntry } from '@/lib/api/journal';
import type { JournalEntry } from '@/types/journal';
import { JournalEntryDialog } from './journal-entry-dialog';

type JournalEntryCardProps = {
  entry: JournalEntry;
};

export function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const t = useTranslations('journal');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteJournalEntry(entry.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal', 'entries'] }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {entry.trade ? (
              <Badge variant="secondary" className="font-mono text-xs">
                {entry.trade.symbol} · {entry.trade.side}
              </Badge>
            ) : null}
            {entry.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">
            {new Date(entry.createdAt).toLocaleDateString()}
          </span>
        </div>

        <p className="text-foreground/90 whitespace-pre-wrap text-sm">{entry.content}</p>

        {entry.screenshotUrls.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {entry.screenshotUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="border-border/60 block h-16 w-16 overflow-hidden rounded-lg border"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <JournalEntryDialog entry={entry}>
            <Button size="sm" variant="outline">
              {t('edit')}
            </Button>
          </JournalEntryDialog>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {t('delete')}
          </Button>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
