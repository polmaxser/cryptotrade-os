'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
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
import { CoinPicker } from '@/components/market/coin-picker';
import { createAlert } from '@/lib/api/alerts';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import type { AlertDirection } from '@/types/alert';
import type { CoinSearchResult } from '@/types/watchlist';

export function CreateAlertDialog() {
  const t = useTranslations('alerts.create');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [coin, setCoin] = useState<CoinSearchResult | null>(null);
  const [direction, setDirection] = useState<AlertDirection>('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      resetAndClose();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function resetAndClose() {
    setOpen(false);
    setCoin(null);
    setDirection('ABOVE');
    setTargetPrice('');
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!coin) return;

    setError(null);
    mutation.mutate({
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      direction,
      targetPrice: Number(targetPrice),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetAndClose();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {!coin ? (
          <CoinPicker onSelect={setCoin} placeholder={t('searchPlaceholder')} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-border/60 flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm font-medium">
                {coin.name} ({coin.symbol.toUpperCase()})
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCoin(null)}>
                {t('change')}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t('directionLabel')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={direction === 'ABOVE' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setDirection('ABOVE')}
                >
                  {t('above')}
                </Button>
                <Button
                  type="button"
                  variant={direction === 'BELOW' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setDirection('BELOW')}
                >
                  {t('below')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPrice">{t('targetPriceLabel')}</Label>
              <Input
                id="targetPrice"
                type="number"
                step="any"
                min="0"
                required
                value={targetPrice}
                onChange={(event) => setTargetPrice(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('creating') : t('create')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
