'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createNote, updateNote } from '@/lib/api/notes';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import type { Note } from '@/types/note';

type NoteDialogProps = {
  note?: Note;
  children: ReactNode;
};

export function NoteDialog({ note, children }: NoteDialogProps) {
  const t = useTranslations('notes.dialog');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      note ? updateNote(note.id, { title, content }) : createNote({ title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !note) {
      setTitle('');
      setContent('');
      setError(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="noteTitle">{t('titleLabel')}</Label>
            <Input
              id="noteTitle"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="noteContent">{t('contentLabel')}</Label>
            <Textarea
              id="noteContent"
              required
              rows={8}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('saving') : note ? t('saveChanges') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
