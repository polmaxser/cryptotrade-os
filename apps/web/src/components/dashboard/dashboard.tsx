'use client';

import { useTranslations } from 'next-intl';
import { useAnalyticsSummaryQuery } from '@/hooks/use-analytics-summary-query';
import { useTradesQuery } from '@/hooks/use-trades-query';
import { PerformanceCard } from './performance-card';
import { RecentTradesCard } from './recent-trades-card';
import { StatsGrid } from './stats-grid';

export function Dashboard() {
  const t = useTranslations('dashboard');

  const analyticsQuery = useAnalyticsSummaryQuery();
  const tradesQuery = useTradesQuery();

  const isLoading = analyticsQuery.isLoading || tradesQuery.isLoading;
  const isError = analyticsQuery.isError || tradesQuery.isError;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(56,189,248,0.08),transparent)]" />

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
          </div>
        ) : isError ? (
          <p className="text-muted-foreground py-12 text-center text-sm">{t('loadError')}</p>
        ) : (
          <>
            <section>
              <PerformanceCard
                summary={analyticsQuery.data!}
                labels={{
                  totalPnl: t('performance.totalPnl'),
                  roi: t('performance.roi'),
                  winRate: t('performance.winRate'),
                }}
              />
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsGrid
                summary={analyticsQuery.data!}
                labels={{
                  winRate: t('stats.winRate'),
                  winningTrades: t('stats.winningTrades'),
                  losingTrades: t('stats.losingTrades'),
                  openTrades: t('stats.openTrades'),
                }}
              />
            </section>

            <section>
              {tradesQuery.data!.length > 0 ? (
                <RecentTradesCard
                  trades={tradesQuery.data!}
                  title={t('recentTrades.title')}
                  openLabel={t('recentTrades.open')}
                />
              ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  {t('recentTrades.empty')}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
