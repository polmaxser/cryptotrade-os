'use client';

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
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
import {
  createJournalEntry,
  removeJournalScreenshot,
  updateJournalEntry,
  uploadJournalScreenshot,
} from '@/lib/api/journal';
import { ApiError } from '@/lib/api/errors';
import { useTradesQuery } from '@/hooks/use-trades-query';
import type { JournalEntry } from '@/types/journal';
import { JournalTagPicker } from './journal-tag-picker';

type JournalEntryDialogProps = {
  entry?: JournalEntry;
  children: ReactNode;
};

export function JournalEntryDialog({ entry, children }: JournalEntryDialogProps) {
  const t = useTranslations('journal.dialog');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();
  const tradesQuery = useTradesQuery();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(entry?.content ?? '');
  const [tradeId, setTradeId] = useState(entry?.tradeId ?? '');
  const [tagIds, setTagIds] = useState<string[]>(entry?.tags.map((tag) => tag.id) ?? []);
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(entry ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function invalidateEntries() {
    queryClient.invalidateQueries({ queryKey: ['journal', 'entries'] });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      savedEntry
        ? updateJournalEntry(savedEntry.id, { content, tradeId: tradeId || null, tagIds })
        : createJournalEntry({ content, tradeId: tradeId || undefined, tagIds }),
    onSuccess: (updated) => {
      setSavedEntry(updated);
      invalidateEntries();
      if (entry) setOpen(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadJournalScreenshot(savedEntry!.id, file),
    onSuccess: (updated) => {
      setSavedEntry(updated);
      invalidateEntries();
    },
    onError: (err) => setUploadError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  const removeScreenshotMutation = useMutation({
    mutationFn: (url: string) => removeJournalScreenshot(savedEntry!.id, url),
    onSuccess: (updated) => {
      setSavedEntry(updated);
      invalidateEntries();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    saveMutation.mutate();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || !savedEntry) return;

    setUploadError(null);
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
    event.target.value = '';
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !entry) {
      setContent('');
      setTradeId('');
      setTagIds([]);
      setSavedEntry(null);
      setError(null);
      setUploadError(null);
    }
  }

  const trades = tradesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{savedEntry ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="journalContent">{t('contentLabel')}</Label>
            <Textarea
              id="journalContent"
              required
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="journalTrade">{t('tradeLabel')}</Label>
            <select
              id="journalTrade"
              value={tradeId}
              onChange={(event) => setTradeId(event.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <option value="">{t('noTrade')}</option>
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.symbol} · {trade.side}
                </option>
              ))}
            </select>
          </div>

          <JournalTagPicker selectedTagIds={tagIds} onChange={setTagIds} />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={saveMutation.isPending || !content.trim()}>
              {saveMutation.isPending ? t('saving') : savedEntry ? t('saveChanges') : t('create')}
            </Button>
          </DialogFooter>
        </form>

        <div className="space-y-2 border-t pt-4">
          <Label>{t('screenshotsLabel')}</Label>

          {!savedEntry ? (
            <p className="text-muted-foreground text-xs">{t('screenshotsHint')}</p>
          ) : (
            <>
              {savedEntry.screenshotUrls.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {savedEntry.screenshotUrls.map((url) => (
                    <div
                      key={url}
                      className="border-border/60 group relative h-20 w-20 overflow-hidden rounded-lg border"
                    >
                      <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeScreenshotMutation.mutate(url)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
              />

              {uploadError ? <p className="text-sm text-red-400">{uploadError}</p> : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
