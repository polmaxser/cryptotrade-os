'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { deleteNote } from '@/lib/api/notes';
import { QUERY_KEYS } from '@/lib/constants';
import type { Note } from '@/types/note';
import { NoteDialog } from './note-dialog';

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const t = useTranslations('notes');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-4">
          <p className="font-medium">{note.title}</p>
          <span className="text-muted-foreground shrink-0 text-xs">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <p className="text-foreground/90 line-clamp-4 whitespace-pre-wrap text-sm">
          {note.content}
        </p>

        <div className="flex gap-2 pt-1">
          <NoteDialog note={note}>
            <Button size="sm" variant="outline">
              {t('edit')}
            </Button>
          </NoteDialog>
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
