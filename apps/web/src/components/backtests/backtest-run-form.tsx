'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStrategiesQuery } from '@/hooks/use-strategies-query';
import { runBacktest } from '@/lib/api/backtests';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import type { BacktestTemplate } from '@/types/backtest';

const TEMPLATES: BacktestTemplate[] = ['MA_CROSSOVER', 'RSI_THRESHOLD', 'DONCHIAN_BREAKOUT'];

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

const DEFAULT_PARAMS: Record<BacktestTemplate, Record<string, string>> = {
  MA_CROSSOVER: { fastPeriod: '9', slowPeriod: '21' },
  RSI_THRESHOLD: { period: '14', oversold: '30', overbought: '70' },
  DONCHIAN_BREAKOUT: { period: '20' },
};

const PARAM_KEYS: Record<BacktestTemplate, string[]> = {
  MA_CROSSOVER: ['fastPeriod', 'slowPeriod'],
  RSI_THRESHOLD: ['period', 'oversold', 'overbought'],
  DONCHIAN_BREAKOUT: ['period'],
};

/** Tailwind needs literal class strings to detect them at build time — can't interpolate `grid-cols-${n}`. */
const PARAM_GRID_CLASS: Record<BacktestTemplate, string> = {
  MA_CROSSOVER: 'grid gap-4 grid-cols-2',
  RSI_THRESHOLD: 'grid gap-4 grid-cols-3',
  DONCHIAN_BREAKOUT: 'grid gap-4 grid-cols-1',
};

export function BacktestRunForm() {
  const t = useTranslations('backtests.form');
  const queryClient = useQueryClient();
  const strategiesQuery = useStrategiesQuery();
  const strategies = strategiesQuery.data ?? [];

  const [template, setTemplate] = useState<BacktestTemplate>('MA_CROSSOVER');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [startingCapital, setStartingCapital] = useState('10000');
  const [feePercent, setFeePercent] = useState('0.1');
  const [strategyId, setStrategyId] = useState('');
  const [params, setParams] = useState<Record<string, string>>(DEFAULT_PARAMS.MA_CROSSOVER);
  const [error, setError] = useState<string | null>(null);

  function handleTemplateChange(next: BacktestTemplate) {
    setTemplate(next);
    setParams(DEFAULT_PARAMS[next]);
  }

  const mutation = useMutation({
    mutationFn: () =>
      runBacktest({
        template,
        symbol: symbol.trim().toUpperCase(),
        timeframe,
        from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : '',
        to: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : '',
        startingCapital: Number(startingCapital),
        feePercent: feePercent === '' ? undefined : Number(feePercent),
        strategyId: strategyId || undefined,
        params: Object.fromEntries(PARAM_KEYS[template].map((key) => [key, Number(params[key])])),
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backtestRuns });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('genericError')),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!fromDate || !toDate) {
      setError(t('periodRequired'));
      return;
    }

    mutation.mutate();
  }

  return (
    <DashboardCard>
      <DashboardCardContent className="py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backtestTemplate">{t('templateLabel')}</Label>
            <select
              id="backtestTemplate"
              value={template}
              onChange={(event) => handleTemplateChange(event.target.value as BacktestTemplate)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {TEMPLATES.map((option) => (
                <option key={option} value={option}>
                  {t(`templates.${option}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backtestSymbol">{t('symbolLabel')}</Label>
              <Input
                id="backtestSymbol"
                required
                placeholder="BTCUSDT"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backtestTimeframe">{t('timeframeLabel')}</Label>
              <select
                id="backtestTimeframe"
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {TIMEFRAMES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backtestFrom">{t('fromLabel')}</Label>
              <Input
                id="backtestFrom"
                type="date"
                required
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backtestTo">{t('toLabel')}</Label>
              <Input
                id="backtestTo"
                type="date"
                required
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </div>

          <div className={PARAM_GRID_CLASS[template]}>
            {PARAM_KEYS[template].map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`param-${key}`}>{t(`params.${key}`)}</Label>
                <Input
                  id={`param-${key}`}
                  type="number"
                  step="any"
                  required
                  value={params[key] ?? ''}
                  onChange={(event) =>
                    setParams((prev) => ({ ...prev, [key]: event.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backtestCapital">{t('startingCapitalLabel')}</Label>
              <Input
                id="backtestCapital"
                type="number"
                step="any"
                min="1"
                required
                value={startingCapital}
                onChange={(event) => setStartingCapital(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backtestFee">{t('feePercentLabel')}</Label>
              <Input
                id="backtestFee"
                type="number"
                step="any"
                min="0"
                value={feePercent}
                onChange={(event) => setFeePercent(event.target.value)}
              />
            </div>
          </div>

          {strategies.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="backtestStrategyId">{t('strategyLabel')}</Label>
              <select
                id="backtestStrategyId"
                value={strategyId}
                onChange={(event) => setStrategyId(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <option value="">{t('strategyNone')}</option>
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('running') : t('run')}
          </Button>
        </form>
      </DashboardCardContent>
    </DashboardCard>
  );
}
