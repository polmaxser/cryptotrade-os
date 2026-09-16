'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard';
import { useMarketOverviewQuery } from '@/hooks/use-market-overview-query';
import type { MarketSentiment } from '@/types/market-overview';
import { formatSignedPercent } from '@/lib/market-overview/formatters';

const VARIANT: Record<MarketSentiment, 'success' | 'danger' | 'secondary'> = {
  RISK_ON: 'success',
  RISK_OFF: 'danger',
  NEUTRAL: 'secondary',
};

/** Compact daily snapshot for the main Dashboard — full detail lives at /market-overview. */
export function MarketOverviewWidget() {
  const t = useTranslations('marketOverview');
  const query = useMarketOverviewQuery();

  if (query.isLoading || query.isError || !query.data) {
    return null;
  }

  const { sentiment, summary, data } = query.data;
  const btc = data.crypto.btc;
  const fearGreed = data.crypto.fearGreed;
  const sp500 = data.usMarkets.sp500;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
        <Link
          href="/market-overview"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          {t('viewAll')}
        </Link>
      </div>

      <DashboardCard>
        <DashboardCardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={VARIANT[sentiment]}>{t(`sentiment.${sentiment}`)}</Badge>
            <p className="text-foreground/90 line-clamp-1 text-sm">{summary}</p>
          </div>

          <div className="flex shrink-0 gap-4 text-sm">
            {btc ? (
              <span>
                BTC{' '}
                <span
                  className={
                    btc.change24hPct >= 0
                      ? 'tabular-nums text-emerald-400'
                      : 'tabular-nums text-red-400'
                  }
                >
                  {formatSignedPercent(btc.change24hPct)}
                </span>
              </span>
            ) : null}
            {fearGreed ? (
              <span>
                {t('fearGreedShort')} <span className="tabular-nums">{fearGreed.value}</span>
              </span>
            ) : null}
            {sp500 ? (
              <span>
                S&amp;P{' '}
                <span
                  className={
                    sp500.changePct >= 0
                      ? 'tabular-nums text-emerald-400'
                      : 'tabular-nums text-red-400'
                  }
                >
                  {formatSignedPercent(sp500.changePct)}
                </span>
              </span>
            ) : null}
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </section>
  );
}
