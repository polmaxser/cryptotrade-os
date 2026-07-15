'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updatePortfolio } from '@/lib/api/portfolios';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import {
  formatCurrency,
  formatDecimal,
  formatPercent,
  formatSignedCurrency,
} from '@/lib/dashboard/formatters';
import type { AnalyticsSummary } from '@/types/analytics';
import type { Portfolio } from '@/types/portfolio';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from './dashboard-card';

type RiskPerformanceCardProps = {
  summary: AnalyticsSummary;
  /** The single portfolio in scope — undefined when viewing "all portfolios". */
  portfolio?: Portfolio;
};

export function RiskPerformanceCard({ summary, portfolio }: RiskPerformanceCardProps) {
  const t = useTranslations('dashboard.riskPerformance');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [startingBalance, setStartingBalance] = useState('');
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const balanceMutation = useMutation({
    mutationFn: (value: number) => updatePortfolio(portfolio!.id, { startingBalance: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolios });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
      setStartingBalance('');
    },
    onError: (err) => setBalanceError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleBalanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBalanceError(null);

    const value = Number(startingBalance);
    if (!startingBalance || Number.isNaN(value) || value < 0) return;

    balanceMutation.mutate(value);
  }

  const showBalanceForm = Boolean(portfolio) && portfolio!.startingBalance === null;

  return (
    <DashboardCard>
      <DashboardCardHeader title={t('title')} description={t('description')} />
      <DashboardCardContent className="space-y-6 pt-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label={t('profitFactor')}
            value={summary.profitFactor !== null ? formatDecimal(summary.profitFactor) : '—'}
          />
          <Metric
            label={t('expectancy')}
            value={formatSignedCurrency(summary.expectancy, 'USDT')}
          />
          <Metric label={t('avgWin')} value={formatCurrency(summary.avgWin, 'USDT')} />
          <Metric label={t('avgLoss')} value={formatCurrency(summary.avgLoss, 'USDT')} />
          <Metric
            label={t('rMultiple')}
            value={
              summary.rMultiple.average !== null
                ? `${formatDecimal(summary.rMultiple.average)}R`
                : '—'
            }
            caption={
              summary.rMultiple.sampleSize > 0
                ? t('rMultipleCaption', { count: summary.rMultiple.sampleSize })
                : t('rMultipleEmpty')
            }
          />
          <Metric
            label={t('sharpe')}
            value={
              summary.sharpeRatioPerTrade !== null
                ? formatDecimal(summary.sharpeRatioPerTrade)
                : '—'
            }
            caption={t('sharpeCaption')}
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/80">{t('maxDrawdown')}</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(summary.maxDrawdown.amount, 'USDT')}
              {summary.maxDrawdown.percent !== null
                ? ` (${formatPercent(summary.maxDrawdown.percent)})`
                : ''}
            </span>
          </div>

          {showBalanceForm ? (
            <form onSubmit={handleBalanceSubmit} className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                step="any"
                min="0"
                placeholder={t('balancePlaceholder')}
                value={startingBalance}
                onChange={(event) => setStartingBalance(event.target.value)}
                className="max-w-[160px]"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={balanceMutation.isPending || !startingBalance}
              >
                {balanceMutation.isPending ? t('balanceSaving') : t('balanceSubmit')}
              </Button>
            </form>
          ) : null}

          {balanceError ? <p className="mt-2 text-sm text-red-400">{balanceError}</p> : null}

          {!portfolio ? (
            <p className="text-muted-foreground mt-2 text-xs">{t('percentHint')}</p>
          ) : null}
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}

type MetricProps = {
  label: string;
  value: string;
  caption?: string;
};

function Metric({ label, value, caption }: MetricProps) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-foreground text-lg font-semibold tabular-nums">{value}</p>
      {caption ? <p className="text-muted-foreground text-xs">{caption}</p> : null}
    </div>
  );
}
