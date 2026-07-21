'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useKlinesQuery } from '@/hooks/use-klines-query';
import { CandlestickChart } from './candlestick-chart';

const TIMEFRAMES = [
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '6h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
];

/** Mirrors BinanceKlinesService's interval map — used only to size a sensible default lookback window. */
const INTERVAL_MS: Record<string, number> = {
  '1m': 60_000,
  '3m': 3 * 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
  '1h': 60 * 60_000,
  '2h': 2 * 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '6h': 6 * 60 * 60_000,
  '8h': 8 * 60 * 60_000,
  '12h': 12 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
  '3d': 3 * 24 * 60 * 60_000,
  '1w': 7 * 24 * 60 * 60_000,
};

const DEFAULT_BARS = 200;

const SELECT_CLASS =
  'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-32 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

export function ChartView() {
  const t = useTranslations('charts');
  const [symbolInput, setSymbolInput] = useState('BTCUSDT');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');

  // Only recomputed when the user applies a new symbol/timeframe, not on
  // every render — otherwise "to: now" would change every render and the
  // query would refetch in a loop.
  const { from, to } = useMemo(() => {
    const intervalMs = INTERVAL_MS[timeframe] ?? 60 * 60_000;
    const now = new Date();
    const fromDate = new Date(now.getTime() - DEFAULT_BARS * intervalMs);
    return { from: fromDate.toISOString(), to: now.toISOString() };
  }, [symbol, timeframe]);

  const klinesQuery = useKlinesQuery(symbol, timeframe, from, to);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = symbolInput.trim().toUpperCase();
    if (next) setSymbol(next);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      <DashboardCard>
        <DashboardCardContent className="py-4">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="chartSymbol">{t('symbolLabel')}</Label>
              <Input
                id="chartSymbol"
                value={symbolInput}
                onChange={(event) => setSymbolInput(event.target.value)}
                placeholder="BTCUSDT"
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chartTimeframe">{t('timeframeLabel')}</Label>
              <select
                id="chartTimeframe"
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
                className={SELECT_CLASS}
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              {t('apply')}
            </Button>
          </form>
        </DashboardCardContent>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardContent className="py-4">
          {klinesQuery.isLoading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
            </div>
          ) : klinesQuery.isError ? (
            <p className="text-muted-foreground py-12 text-center text-sm">{t('loadError')}</p>
          ) : klinesQuery.data && klinesQuery.data.length > 0 ? (
            <CandlestickChart candles={klinesQuery.data} />
          ) : (
            <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
          )}
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
