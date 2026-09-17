import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard';
import type { IndexQuote } from '@/types/market-overview';
import { formatCompactNumber, formatSignedPercent } from '@/lib/market-overview/formatters';

export function IndexStatCard({ label, data }: { label: string; data: IndexQuote | null }) {
  const t = useTranslations('marketOverview');

  return (
    <DashboardCard className="h-full">
      <DashboardCardContent className="flex h-full flex-col justify-between gap-3 py-5">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
        {data === null ? (
          <p className="text-muted-foreground text-sm">—</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums">
                {data.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
              <span
                className={
                  data.changePct >= 0
                    ? 'font-medium tabular-nums text-emerald-400'
                    : 'font-medium tabular-nums text-red-400'
                }
              >
                {formatSignedPercent(data.changePct)}
              </span>
            </div>
            {data.volume ? (
              <p className="text-muted-foreground text-xs">
                {t('volumeLabel', { volume: formatCompactNumber(data.volume) })}
              </p>
            ) : null}
          </>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
