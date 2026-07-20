'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import type { EconomicEvent } from '@/types/economic-event';

type EconomicEventCardProps = {
  event: EconomicEvent;
};

const IMPORTANCE_VARIANT = {
  HIGH: 'danger',
  MEDIUM: 'secondary',
  LOW: 'outline',
} as const;

export function EconomicEventCard({ event }: EconomicEventCardProps) {
  const t = useTranslations('economicCalendar');
  const locale = useLocale();

  const date = new Date(event.eventDate);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge>{t(`categories.${event.category}`)}</Badge>
            <Badge variant={IMPORTANCE_VARIANT[event.importance]}>
              {t(`importance.${event.importance}`)}
            </Badge>
            <span className="text-muted-foreground text-xs">{event.country}</span>
          </div>
          <span className="text-muted-foreground text-xs">
            {dateLabel} · {timeLabel}
          </span>
        </div>

        <h3 className="text-base font-semibold">{event.title}</h3>
        {event.description ? (
          <p className="text-muted-foreground text-sm">{event.description}</p>
        ) : null}

        {event.forecast || event.previous || event.actual ? (
          <div className="grid grid-cols-3 gap-3 pt-1 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">{t('forecast')}</p>
              <p>{event.forecast ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('previous')}</p>
              <p>{event.previous ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('actual')}</p>
              <p>{event.actual ?? '—'}</p>
            </div>
          </div>
        ) : null}
      </DashboardCardContent>
    </DashboardCard>
  );
}
