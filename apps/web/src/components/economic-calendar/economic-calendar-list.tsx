'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useEconomicEventsQuery } from '@/hooks/use-economic-events-query';
import type { EconomicEventCategory } from '@/types/economic-event';
import { EconomicEventCard } from './economic-event-card';

const CATEGORIES: EconomicEventCategory[] = ['FOMC', 'CPI', 'NFP'];
const RANGE_DAYS = 180;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function EconomicCalendarList() {
  const t = useTranslations('economicCalendar');
  const [category, setCategory] = useState<EconomicEventCategory | undefined>(undefined);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 30));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + RANGE_DAYS);
    return { from: toDateKey(start), to: toDateKey(end) };
  }, []);

  const eventsQuery = useEconomicEventsQuery(from, to, category);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category === undefined ? 'default' : 'outline'}
          onClick={() => setCategory(undefined)}
        >
          {t('filterAll')}
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? 'default' : 'outline'}
            onClick={() => setCategory(c)}
          >
            {t(`categories.${c}`)}
          </Button>
        ))}
      </div>

      {eventsQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : eventsQuery.isError ? (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('loadError')}</p>
      ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {eventsQuery.data.map((event) => (
            <EconomicEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
