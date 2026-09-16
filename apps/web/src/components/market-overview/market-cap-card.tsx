import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { CryptoMarketCapData, DominanceData } from '@/types/market-overview';
import { formatCompactUsd, formatSignedPercent } from '@/lib/market-overview/formatters';

export function MarketCapCard({
  marketCap,
  dominance,
  stablecoinMarketCapUsd,
}: {
  marketCap: CryptoMarketCapData | null;
  dominance: DominanceData | null;
  stablecoinMarketCapUsd: number | null;
}) {
  const t = useTranslations('marketOverview.marketCap');

  return (
    <DashboardCard>
      <DashboardCardHeader title={t('title')} />
      <DashboardCardContent className="space-y-3">
        {marketCap === null ? (
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
        ) : (
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums">
              {formatCompactUsd(marketCap.totalUsd)}
            </span>
            <span
              className={
                marketCap.change24hPct >= 0
                  ? 'font-medium tabular-nums text-emerald-400'
                  : 'font-medium tabular-nums text-red-400'
              }
            >
              {formatSignedPercent(marketCap.change24hPct)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 border-t pt-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">{t('btcDominance')}</p>
            <p className="tabular-nums">{dominance ? `${dominance.btcPct.toFixed(1)}%` : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('ethDominance')}</p>
            <p className="tabular-nums">{dominance ? `${dominance.ethPct.toFixed(1)}%` : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('stablecoins')}</p>
            <p className="tabular-nums">
              {stablecoinMarketCapUsd !== null ? formatCompactUsd(stablecoinMarketCapUsd) : '—'}
            </p>
          </div>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
