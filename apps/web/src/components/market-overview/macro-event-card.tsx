import { useTranslations } from 'next-intl';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from '@/components/dashboard';
import type { NextMacroEvent } from '@/types/market-overview';
import { timeUntil } from '@/lib/market-overview/formatters';

export function MacroEventCard({ data }: { data: NextMacroEvent | null }) {
  const t = useTranslations('marketOverview.macroEvent');

  return (
    <DashboardCard>
      <DashboardCardHeader title={t('title')} />
      <DashboardCardContent>
        {data === null ? (
          <p className="text-muted-foreground text-sm">{t('none')}</p>
        ) : (
          <div className="space-y-1">
            <p className="font-medium">{data.title}</p>
            <p className="text-muted-foreground text-sm">
              {new Date(data.eventDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {' · '}
              {t('inDays', { days: timeUntil(data.eventDate).days })}
            </p>
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
