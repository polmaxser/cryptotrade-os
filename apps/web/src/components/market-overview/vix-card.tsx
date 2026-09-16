import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { IndexQuote } from '@/types/market-overview';
import { Gauge } from './gauge';

/** VIX rarely goes past ~50 outside a real crisis — a fixed 0-50 scale keeps the gauge meaningful at normal levels instead of always sitting near the low end of a wider range. */
const VIX_SCALE_MAX = 50;

export function VixCard({ data }: { data: IndexQuote | null }) {
  const t = useTranslations('marketOverview.vix');

  return (
    <DashboardCard>
      <DashboardCardHeader title={t('title')} description={t('description')} />
      <DashboardCardContent className="space-y-3">
        {data === null ? (
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
        ) : (
          <>
            <span className="text-2xl font-semibold tabular-nums">{data.price.toFixed(1)}</span>
            <Gauge
              value={data.price}
              min={0}
              max={VIX_SCALE_MAX}
              direction="red-high"
              minLabel={t('calm')}
              maxLabel={t('fearful')}
            />
          </>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
