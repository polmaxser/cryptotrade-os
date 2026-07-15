'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CoinPicker } from '@/components/market/coin-picker';
import { addWatchlistItem } from '@/lib/api/watchlist';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import type { CoinSearchResult } from '@/types/watchlist';

export function AddWatchlistItemDialog() {
  const t = useTranslations('watchlist.add');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: addWatchlistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.watchlist });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleSelect(coin: CoinSearchResult) {
    setError(null);
    mutation.mutate({ coinId: coin.id, symbol: coin.symbol.toUpperCase(), name: coin.name });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        <CoinPicker onSelect={handleSelect} placeholder={t('searchPlaceholder')} />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
