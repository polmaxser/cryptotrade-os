import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { TechnicalReadout } from '@/types/market-overview';
import {
  formatCompactUsd,
  formatPrice,
  formatSignedPercent,
} from '@/lib/market-overview/formatters';

/** Above this, today's volume is unusual enough relative to its own 30-day average to call out on its own. */
const VOLUME_SPIKE_RATIO = 1.5;
const VOLUME_QUIET_RATIO = 0.5;

const TREND_VARIANT: Record<
  NonNullable<TechnicalReadout['trend']>,
  'success' | 'danger' | 'secondary'
> = {
  ABOVE_BOTH: 'success',
  BELOW_BOTH: 'danger',
  MIXED: 'secondary',
};

export function TechnicalsCard({
  symbol,
  data,
}: {
  symbol: string;
  data: TechnicalReadout | null;
}) {
  const t = useTranslations('marketOverview.technicals');

  return (
    <DashboardCard>
      <DashboardCardHeader title={symbol} />
      <DashboardCardContent className="space-y-3">
        {data === null ? (
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums">
                {formatPrice(data.priceUsd)}
              </span>
              <span
                className={
                  data.change24hPct >= 0
                    ? 'font-medium tabular-nums text-emerald-400'
                    : 'font-medium tabular-nums text-red-400'
                }
              >
                {formatSignedPercent(data.change24hPct)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t('rsi14')}</p>
                <p className="tabular-nums">{data.rsi14 !== null ? data.rsi14.toFixed(0) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('trend')}</p>
                {data.trend ? (
                  <Badge variant={TREND_VARIANT[data.trend]}>{t(`trendValue.${data.trend}`)}</Badge>
                ) : (
                  <p>—</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('sma50')}</p>
                <p className="tabular-nums">
                  {data.sma50 !== null ? formatPrice(data.sma50) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('sma200')}</p>
                <p className="tabular-nums">
                  {data.sma200 !== null ? formatPrice(data.sma200) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('volume24h')}</p>
                <p className="tabular-nums">
                  {data.volume24hUsd !== null ? formatCompactUsd(data.volume24hUsd) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('avgVolume30d')}</p>
                <p className="tabular-nums">
                  {data.avgVolume30dUsd !== null ? formatCompactUsd(data.avgVolume30dUsd) : '—'}
                </p>
              </div>
            </div>

            {data.volumeRatio !== null && data.volumeRatio >= VOLUME_SPIKE_RATIO ? (
              <Badge variant="secondary">
                {t('volumeSpike', { multiple: data.volumeRatio.toFixed(1) })}
              </Badge>
            ) : data.volumeRatio !== null && data.volumeRatio <= VOLUME_QUIET_RATIO ? (
              <Badge variant="secondary">
                {t('volumeQuiet', { multiple: data.volumeRatio.toFixed(1) })}
              </Badge>
            ) : null}
          </>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
