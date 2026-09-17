import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { FearGreedData } from '@/types/market-overview';
import { Gauge } from './gauge';

/** alternative.me always returns one of these 5 fixed English strings — mapped to a translation key rather than shown as-is. */
const CLASSIFICATION_KEYS: Record<string, string> = {
  'Extreme Fear': 'classification.EXTREME_FEAR',
  Fear: 'classification.FEAR',
  Neutral: 'classification.NEUTRAL',
  Greed: 'classification.GREED',
  'Extreme Greed': 'classification.EXTREME_GREED',
};

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
              <span className="text-muted-foreground text-sm">
                {(() => {
                  const key = CLASSIFICATION_KEYS[data.classification];
                  return key ? t(key) : data.classification;
                })()}
              </span>
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
