'use client';

import { useTranslations } from 'next-intl';
import { useBacktestRunsQuery } from '@/hooks/use-backtest-runs-query';
import { BacktestRunCard } from './backtest-run-card';
import { BacktestRunForm } from './backtest-run-form';

export function BacktestsList() {
  const t = useTranslations('backtests');
  const runsQuery = useBacktestRunsQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      <BacktestRunForm />

      {runsQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : runsQuery.isError ? (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('loadError')}</p>
      ) : runsQuery.data && runsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {runsQuery.data.map((run) => (
            <BacktestRunCard key={run.id} run={run} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
