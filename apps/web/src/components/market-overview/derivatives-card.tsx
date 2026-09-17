import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { DerivativesData, LiquidationRisk } from '@/types/market-overview';
import { formatCompactUsd } from '@/lib/market-overview/formatters';

const RISK_VARIANT: Record<LiquidationRisk, 'success' | 'danger'> = {
  LOW: 'success',
  ELEVATED_LONG: 'danger',
  ELEVATED_SHORT: 'danger',
};

export function DerivativesCard({ data }: { data: DerivativesData | null }) {
  const t = useTranslations('marketOverview.derivatives');

  return (
    <DashboardCard>
      <DashboardCardHeader title={t('title')} description={t('description')} />
      <DashboardCardContent className="space-y-3">
        {data === null ? (
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
        ) : (
          <>
            {data.liquidationRisk ? (
              <div className="flex items-center gap-2">
                <Badge variant={RISK_VARIANT[data.liquidationRisk]}>
                  {t(`riskValue.${data.liquidationRisk}`)}
                </Badge>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t('fundingRate')}</p>
                <p className="tabular-nums">
                  {data.btcFundingRatePct !== null ? `${data.btcFundingRatePct.toFixed(4)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('openInterest')}</p>
                <p className="tabular-nums">
                  {data.btcOpenInterestUsd !== null
                    ? formatCompactUsd(data.btcOpenInterestUsd)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('longShortRatio')}</p>
                <p className="tabular-nums">
                  {data.btcLongShortRatio !== null ? data.btcLongShortRatio.toFixed(2) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('takerRatio')}</p>
                <p className="tabular-nums">
                  {data.btcTakerBuySellRatio !== null ? data.btcTakerBuySellRatio.toFixed(2) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('platformVolume')}</p>
                <p className="tabular-nums">
                  {data.platformVolume24hUsd !== null
                    ? formatCompactUsd(data.platformVolume24hUsd)
                    : '—'}
                </p>
              </div>
            </div>
          </>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
