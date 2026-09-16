import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { FearGreedData } from '@/types/market-overview';
import { Gauge } from './gauge';

export function FearGreedCard({ data }: { data: FearGreedData | null }) {
  const t = useTranslations('marketOverview.fearGreed');

  return (
    <DashboardCard>
      <DashboardCardHeader title={t('title')} />
      <DashboardCardContent className="space-y-3">
        {data === null ? (
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{data.value}</span>
              <span className="text-muted-foreground text-sm">{data.classification}</span>
              {data.previousValue !== null ? (
                <span className="text-muted-foreground ml-auto text-xs">
                  {t('yesterday', { value: data.previousValue })}
                </span>
              ) : null}
            </div>
            <Gauge
              value={data.value}
              min={0}
              max={100}
              direction="green-high"
              minLabel={t('extremeFear')}
              maxLabel={t('extremeGreed')}
            />
          </>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
