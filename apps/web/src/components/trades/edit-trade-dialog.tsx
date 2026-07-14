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
import { updateTrade } from '@/lib/api/trades';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '@/lib/date';
import type { Trade, TradeStatus } from '@/types/trade';

type EditTradeDialogProps = {
  trade: Trade;
  children: ReactNode;
};

export function EditTradeDialog({ trade, children }: EditTradeDialogProps) {
  const t = useTranslations('trades.edit');
  const tErrors = useTranslations('trades.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TradeStatus>(trade.status);
  const [exitPrice, setExitPrice] = useState(trade.exitPrice ?? '');
  const [pnl, setPnl] = useState(trade.pnl ?? '');
  const [pnlPercent, setPnlPercent] = useState(trade.pnlPercent ?? '');
  const [closedAt, setClosedAt] = useState(() =>
    toDatetimeLocalValue(trade.closedAt ? new Date(trade.closedAt) : new Date()),
  );
  const [notes, setNotes] = useState(trade.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateTrade>[1]) => updateTrade(trade.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trades });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analyticsSummary });
      setOpen(false);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : tErrors('generic'));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    mutation.mutate({
      status,
      notes: notes.trim() || undefined,
      ...(status === 'CLOSED'
        ? {
            exitPrice: exitPrice === '' ? undefined : Number(exitPrice),
            pnl: pnl === '' ? undefined : Number(pnl),
            pnlPercent: pnlPercent === '' ? undefined : Number(pnlPercent),
            closedAt: fromDatetimeLocalValue(closedAt),
          }
        : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('title')} — {trade.symbol}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('statusLabel')}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === 'OPEN' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setStatus('OPEN')}
              >
                {t('statusOpen')}
              </Button>
              <Button
                type="button"
                variant={status === 'CLOSED' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setStatus('CLOSED')}
              >
                {t('statusClosed')}
              </Button>
            </div>
          </div>

          {status === 'CLOSED' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exitPrice">{t('exitPriceLabel')}</Label>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="any"
                    min="0"
                    value={exitPrice}
                    onChange={(event) => setExitPrice(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closedAt">{t('closedAtLabel')}</Label>
                  <Input
                    id="closedAt"
                    type="datetime-local"
                    value={closedAt}
                    onChange={(event) => setClosedAt(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pnl">{t('pnlLabel')}</Label>
                  <Input
                    id="pnl"
                    type="number"
                    step="any"
                    value={pnl}
                    onChange={(event) => setPnl(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pnlPercent">{t('pnlPercentLabel')}</Label>
                  <Input
                    id="pnlPercent"
                    type="number"
                    step="any"
                    value={pnlPercent}
                    onChange={(event) => setPnlPercent(event.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="editNotes">{t('notesLabel')}</Label>
            <Textarea
              id="editNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
