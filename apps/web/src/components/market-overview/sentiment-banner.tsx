import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { MarketSentiment } from '@/types/market-overview';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard';

const VARIANT: Record<MarketSentiment, 'success' | 'danger' | 'secondary'> = {
  RISK_ON: 'success',
  RISK_OFF: 'danger',
  NEUTRAL: 'secondary',
};

export function SentimentBanner({
  sentiment,
  summary,
  capturedAt,
}: {
  sentiment: MarketSentiment;
  summary: string;
  capturedAt: string;
}) {
  const t = useTranslations('marketOverview');

  return (
    <DashboardCard>
      <DashboardCardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={VARIANT[sentiment]} className="px-3 py-1 text-sm">
            {t(`sentiment.${sentiment}`)}
          </Badge>
          <p className="text-foreground/90 text-sm sm:text-base">{summary}</p>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs">
          {t('updatedAt', { time: new Date(capturedAt).toLocaleTimeString() })}
        </p>
      </DashboardCardContent>
    </DashboardCard>
  );
}
