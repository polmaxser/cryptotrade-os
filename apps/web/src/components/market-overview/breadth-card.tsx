import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { BreadthData, MarketMover } from '@/types/market-overview';
import { formatCompactUsd, formatSignedPercent } from '@/lib/market-overview/formatters';

function MoverRow({ mover }: { mover: MarketMover }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-mono">{mover.symbol}</span>
      <span
        className={
          mover.change24hPct >= 0 ? 'tabular-nums text-emerald-400' : 'tabular-nums text-red-400'
        }
      >
        {formatSignedPercent(mover.change24hPct)}
      </span>
    </div>
  );
}

/** Volume is the primary metric here rather than % change — this list answers "where's the money moving," independent of direction. */
function VolumeMoverRow({ mover }: { mover: MarketMover }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-mono">{mover.symbol}</span>
      <span className="text-muted-foreground tabular-nums">
        {formatCompactUsd(mover.volumeUsd)}
      </span>
    </div>
  );
}

export function BreadthCard({ data }: { data: BreadthData | null }) {
  const t = useTranslations('marketOverview.breadth');

  if (data === null) {
    return (
      <DashboardCard>
        <DashboardCardHeader title={t('title')} />
        <DashboardCardContent>
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
        </DashboardCardContent>
      </DashboardCard>
    );
  }

  const greenPct = (data.greenCount / data.totalCount) * 100;

  return (
    <DashboardCard>
      <DashboardCardHeader
        title={t('title')}
        description={t('description', { green: data.greenCount, total: data.totalCount })}
      />
      <DashboardCardContent className="space-y-4">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-red-500/30">
          <div className="h-full bg-emerald-500" style={{ width: `${greenPct}%` }} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {t('topGainers')}
            </p>
            {data.topGainers.map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {t('topLosers')}
            </p>
            {data.topLosers.map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {t('topByVolume')}
            </p>
            {data.topByVolume.map((m) => (
              <VolumeMoverRow key={m.symbol} mover={m} />
            ))}
          </div>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
