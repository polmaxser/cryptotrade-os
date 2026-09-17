import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { OnChainData } from '@/types/market-overview';
import {
  formatBytes,
  formatCompactNumber,
  formatCompactUsd,
  formatHashRate,
} from '@/lib/market-overview/formatters';

export function OnChainCard({ data }: { data: OnChainData | null }) {
  const t = useTranslations('marketOverview.onChain');

  return (
    <DashboardCard>
      <DashboardCardHeader title={t('title')} />
      <DashboardCardContent>
        {data === null ? (
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">{t('hashRate')}</p>
              <p className="tabular-nums">
                {data.hashRate !== null ? formatHashRate(data.hashRate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('difficulty')}</p>
              <p className="tabular-nums">
                {data.difficulty !== null ? data.difficulty.toLocaleString('en-US') : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('mempoolSize')}</p>
              <p className="tabular-nums">
                {data.mempoolSizeBytes !== null ? formatBytes(data.mempoolSizeBytes) : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('txVolume')}</p>
              <p className="tabular-nums">
                {data.estimatedTxVolumeUsd !== null
                  ? formatCompactUsd(data.estimatedTxVolumeUsd)
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('txCount')}</p>
              <p className="tabular-nums">
                {data.transactionCount !== null ? formatCompactNumber(data.transactionCount) : '—'}
              </p>
            </div>
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
