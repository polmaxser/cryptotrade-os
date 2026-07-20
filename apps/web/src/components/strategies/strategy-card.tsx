'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { deleteStrategy } from '@/lib/api/strategies';
import { QUERY_KEYS } from '@/lib/constants';
import { formatCurrency, formatPercent, formatSignedPnl } from '@/lib/dashboard/formatters';
import { useStrategyPerformanceQuery } from '@/hooks/use-strategy-performance-query';
import type { Strategy } from '@/types/strategy';
import { StrategyDialog } from './strategy-dialog';

type StrategyCardProps = {
  strategy: Strategy;
};

export function StrategyCard({ strategy }: StrategyCardProps) {
  const t = useTranslations('strategies');
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const performanceQuery = useStrategyPerformanceQuery(strategy.id, expanded);

  const deleteMutation = useMutation({
    mutationFn: () => deleteStrategy(strategy.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.strategies }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{strategy.name}</h3>
              {strategy.timeframe ? <Badge variant="secondary">{strategy.timeframe}</Badge> : null}
              <Badge variant={strategy.isActive ? 'success' : 'outline'}>
                {strategy.isActive ? t('active') : t('inactive')}
              </Badge>
            </div>
            {strategy.description ? (
              <p className="text-muted-foreground text-sm">{strategy.description}</p>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <div className="space-y-3 text-sm">
            {strategy.entryCriteria ? (
              <div>
                <p className="text-muted-foreground text-xs uppercase">{t('entryCriteriaLabel')}</p>
                <p>{strategy.entryCriteria}</p>
              </div>
            ) : null}
            {strategy.exitCriteria ? (
              <div>
                <p className="text-muted-foreground text-xs uppercase">{t('exitCriteriaLabel')}</p>
                <p>{strategy.exitCriteria}</p>
              </div>
            ) : null}
            {strategy.riskManagement ? (
              <div>
                <p className="text-muted-foreground text-xs uppercase">
                  {t('riskManagementLabel')}
                </p>
                <p>{strategy.riskManagement}</p>
              </div>
            ) : null}

            <div>
              <p className="text-muted-foreground pb-2 text-xs uppercase">{t('performance')}</p>
              {performanceQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">{t('performanceLoading')}</p>
              ) : performanceQuery.isError ? (
                <p className="text-muted-foreground text-sm">{t('performanceError')}</p>
              ) : performanceQuery.data ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground text-xs">{t('totalPnl')}</p>
                    <p
                      className={
                        performanceQuery.data.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }
                    >
                      {formatSignedPnl(performanceQuery.data.totalPnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('winRate')}</p>
                    <p>{formatPercent(performanceQuery.data.winRate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('closedTrades')}</p>
                    <p>{performanceQuery.data.closedTrades}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('expectancy')}</p>
                    <p>{formatCurrency(performanceQuery.data.expectancy, 'USD')}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? t('collapse') : t('expand')}
          </Button>
          <StrategyDialog strategy={strategy}>
            <Button size="sm" variant="outline">
              {t('edit')}
            </Button>
          </StrategyDialog>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {t('delete')}
          </Button>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
