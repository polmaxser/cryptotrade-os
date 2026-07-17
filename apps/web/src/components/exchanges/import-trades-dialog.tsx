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
import { importTrades } from '@/lib/api/exchanges';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { usePortfoliosQuery } from '@/hooks/use-portfolios-query';
import type { ImportResult } from '@/types/exchange';

type ImportTradesDialogProps = {
  connectionId: string;
  children: ReactNode;
};

export function ImportTradesDialog({ connectionId, children }: ImportTradesDialogProps) {
  const t = useTranslations('exchanges.import');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();
  const portfoliosQuery = usePortfoliosQuery();
  const portfolios = portfoliosQuery.data ?? [];

  const [open, setOpen] = useState(false);
  const [symbolsInput, setSymbolsInput] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const symbols = symbolsInput
        .split(',')
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean);

      return importTrades(connectionId, {
        symbols,
        portfolioId: portfolioId || undefined,
        from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
      });
    },
    onSuccess: (data) => {
      setResults(data);
      setError(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trades });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exchangeConnections });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSymbolsInput('');
      setPortfolioId('');
      setFromDate('');
      setToDate('');
      setError(null);
      setResults(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (Boolean(fromDate) !== Boolean(toDate)) {
      setError(t('periodBothRequired'));
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setError(t('periodInvalidOrder'));
      return;
    }

    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="importSymbols">{t('symbolsLabel')}</Label>
            <Input
              id="importSymbols"
              required
              placeholder={t('symbolsPlaceholder')}
              value={symbolsInput}
              onChange={(event) => setSymbolsInput(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t('symbolsHint')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('periodLabel')}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                aria-label={t('periodFromLabel')}
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
              <Input
                type="date"
                aria-label={t('periodToLabel')}
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
            <p className="text-muted-foreground text-xs">{t('periodHint')}</p>
          </div>

          {portfolios.length > 1 ? (
            <div className="space-y-2">
              <Label htmlFor="importPortfolio">{t('portfolioLabel')}</Label>
              <select
                id="importPortfolio"
                value={portfolioId}
                onChange={(event) => setPortfolioId(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <option value="">{t('portfolioDefault')}</option>
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {results ? (
            <div className="space-y-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
              {results.map((result) => (
                <p key={result.symbol} className="text-emerald-300">
                  {t('resultLine', { symbol: result.symbol, count: result.tradesImported })}
                </p>
              ))}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('importing') : t('import')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
