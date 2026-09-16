'use client';

import { useTranslations } from 'next-intl';
import { useMarketOverviewQuery } from '@/hooks/use-market-overview-query';
import { SentimentBanner } from './sentiment-banner';
import { FearGreedCard } from './fear-greed-card';
import { MarketCapCard } from './market-cap-card';
import { TechnicalsCard } from './technicals-card';
import { BreadthCard } from './breadth-card';
import { DerivativesCard } from './derivatives-card';
import { OnChainCard } from './onchain-card';
import { IndexStatCard } from './index-stat-card';
import { VixCard } from './vix-card';
import { MacroEventCard } from './macro-event-card';

export function MarketOverviewPage() {
  const t = useTranslations('marketOverview');
  const query = useMarketOverviewQuery();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : query.isError || !query.data ? (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('loadError')}</p>
      ) : (
        <>
          <SentimentBanner
            sentiment={query.data.sentiment}
            summary={query.data.summary}
            capturedAt={query.data.capturedAt}
          />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">{t('sections.crypto')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FearGreedCard data={query.data.data.crypto.fearGreed} />
              <MarketCapCard
                marketCap={query.data.data.crypto.marketCap}
                dominance={query.data.data.crypto.dominance}
                stablecoinMarketCapUsd={query.data.data.crypto.stablecoinMarketCapUsd}
              />
              <TechnicalsCard symbol="BTC" data={query.data.data.crypto.btc} />
              <TechnicalsCard symbol="ETH" data={query.data.data.crypto.eth} />
              <BreadthCard data={query.data.data.crypto.breadth} />
              <DerivativesCard data={query.data.data.crypto.derivatives} />
              <OnChainCard data={query.data.data.crypto.onChain} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">{t('sections.usMarkets')}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <IndexStatCard label="S&P 500" data={query.data.data.usMarkets.sp500} />
              <IndexStatCard label="Nasdaq" data={query.data.data.usMarkets.nasdaq} />
              <IndexStatCard label="Dow Jones" data={query.data.data.usMarkets.dow} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <VixCard data={query.data.data.usMarkets.vix} />
              <IndexStatCard label={t('dxy')} data={query.data.data.usMarkets.dxy} />
              <IndexStatCard label={t('us10y')} data={query.data.data.usMarkets.us10y} />
            </div>
            <MacroEventCard data={query.data.data.usMarkets.nextMacroEvent} />
          </section>

          <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
        </>
      )}
    </div>
  );
}
