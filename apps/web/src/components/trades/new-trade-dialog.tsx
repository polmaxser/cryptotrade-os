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
import { Textarea } from '@/components/ui/textarea';
import { usePortfoliosQuery } from '@/hooks/use-portfolios-query';
import { useStrategiesQuery } from '@/hooks/use-strategies-query';
import { createTrade } from '@/lib/api/trades';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '@/lib/date';
import type { MarginType, TradeSide } from '@/types/trade';

export function NewTradeDialog() {
  const t = useTranslations('trades.new');
  const tErrors = useTranslations('trades.errors');
  const queryClient = useQueryClient();
  const portfoliosQuery = usePortfoliosQuery();
  const strategiesQuery = useStrategiesQuery();

  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<TradeSide>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [leverage, setLeverage] = useState('');
  const [marginType, setMarginType] = useState<MarginType | ''>('');
  const [quantity, setQuantity] = useState('');
  const [openedAt, setOpenedAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [portfolioId, setPortfolioId] = useState<string>('');
  const [strategy, setStrategy] = useState('');
  const [strategyId, setStrategyId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const portfolios = portfoliosQuery.data ?? [];
  const strategies = strategiesQuery.data ?? [];

  function resetForm() {
    setSymbol('');
    setSide('LONG');
    setEntryPrice('');
    setStopLossPrice('');
    setLeverage('');
    setMarginType('');
    setQuantity('');
    setOpenedAt(toDatetimeLocalValue(new Date()));
    setPortfolioId('');
    setStrategy('');
    setStrategyId('');
    setNotes('');
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trades });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : tErrors('generic'));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    mutation.mutate({
      symbol: symbol.trim().toUpperCase(),
      side,
      entryPrice: Number(entryPrice),
      stopLossPrice: stopLossPrice === '' ? undefined : Number(stopLossPrice),
      leverage: leverage === '' ? undefined : Number(leverage),
      marginType: marginType || undefined,
      quantity: Number(quantity),
      openedAt: fromDatetimeLocalValue(openedAt),
      portfolioId: portfolioId || undefined,
      strategy: strategy.trim() || undefined,
      strategyId: strategyId || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">{t('symbolLabel')}</Label>
              <Input
                id="symbol"
                required
                placeholder="BTCUSDT"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('sideLabel')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={side === 'LONG' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSide('LONG')}
                >
                  {t('sideLong')}
                </Button>
                <Button
                  type="button"
                  variant={side === 'SHORT' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSide('SHORT')}
                >
                  {t('sideShort')}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice">{t('entryPriceLabel')}</Label>
              <Input
                id="entryPrice"
                type="number"
                step="any"
                min="0"
                required
                value={entryPrice}
                onChange={(event) => setEntryPrice(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">{t('quantityLabel')}</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopLossPrice">{t('stopLossPriceLabel')}</Label>
            <Input
              id="stopLossPrice"
              type="number"
              step="any"
              min="0"
              value={stopLossPrice}
              onChange={(event) => setStopLossPrice(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leverage">{t('leverageLabel')}</Label>
              <Input
                id="leverage"
                type="number"
                step="1"
                min="1"
                value={leverage}
                onChange={(event) => setLeverage(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginType">{t('marginTypeLabel')}</Label>
              <select
                id="marginType"
                value={marginType}
                onChange={(event) => setMarginType(event.target.value as MarginType | '')}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <option value="">{t('marginTypeNone')}</option>
                <option value="ISOLATED">{t('marginTypeIsolated')}</option>
                <option value="CROSS">{t('marginTypeCross')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openedAt">{t('openedAtLabel')}</Label>
            <Input
              id="openedAt"
              type="datetime-local"
              required
              value={openedAt}
              onChange={(event) => setOpenedAt(event.target.value)}
            />
          </div>

          {portfolios.length > 1 ? (
            <div className="space-y-2">
              <Label htmlFor="portfolioId">{t('portfolioLabel')}</Label>
              <select
                id="portfolioId"
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

          <div className="space-y-2">
            <Label htmlFor="strategy">{t('strategyLabel')}</Label>
            <Input
              id="strategy"
              value={strategy}
              onChange={(event) => setStrategy(event.target.value)}
            />
          </div>

          {strategies.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="strategyId">{t('formalStrategyLabel')}</Label>
              <select
                id="strategyId"
                value={strategyId}
                onChange={(event) => setStrategyId(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <option value="">{t('formalStrategyNone')}</option>
                {strategies.map((strategyOption) => (
                  <option key={strategyOption.id} value={strategyOption.id}>
                    {strategyOption.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notesLabel')}</Label>
            <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
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
