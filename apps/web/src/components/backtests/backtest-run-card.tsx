'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { formatCurrency, formatPercent, formatSignedPnl } from '@/lib/dashboard/formatters';
import type { BacktestRun } from '@/types/backtest';
import { EquityCurveChart } from './equity-curve-chart';

type BacktestRunCardProps = {
  run: BacktestRun;
};

export function BacktestRunCard({ run }: BacktestRunCardProps) {
  const t = useTranslations('backtests');
  const [expanded, setExpanded] = useState(false);

  const isProfit = run.summary.totalPnlPercent >= 0;

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-medium">{run.symbol}</span>
              <Badge variant="secondary">{t(`templates.${run.template}`)}</Badge>
              <Badge variant="outline">{run.timeframe}</Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {new Date(run.periodStart).toLocaleDateString()} –{' '}
              {new Date(run.periodEnd).toLocaleDateString()}
            </p>
          </div>
          <span className={isProfit ? 'text-emerald-400' : 'text-red-400'}>
            {formatSignedPnl(run.summary.totalPnlPercent)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">{t('winRate')}</p>
            <p>{formatPercent(run.summary.winRate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('totalTrades')}</p>
            <p>{run.summary.totalTrades}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('maxDrawdown')}</p>
            <p>{formatPercent(run.summary.maxDrawdownPercent)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('finalEquity')}</p>
            <p>{formatCurrency(run.summary.finalEquity, 'USD')}</p>
          </div>
        </div>

        {expanded ? (
          <div className="pt-2">
            <EquityCurveChart points={run.equityCurve} />
          </div>
        ) : null}

        <Button size="sm" variant="ghost" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? t('collapse') : t('expand')}
        </Button>
      </DashboardCardContent>
    </DashboardCard>
  );
}
