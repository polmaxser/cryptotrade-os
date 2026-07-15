'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { useCalendarQuery } from '@/hooks/use-calendar-query';
import { formatSignedCurrency } from '@/lib/dashboard/formatters';
import { cn } from '@/lib/utils';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [yearStr, monthStr] = monthKey.split('-');
  return { year: Number(yearStr), month: Number(monthStr) };
}

function shiftMonth(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function CalendarView() {
  const t = useTranslations('calendar');
  const locale = useLocale();

  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const calendarQuery = useCalendarQuery(monthKey);

  const pnlByDate = useMemo(
    () => new Map((calendarQuery.data ?? []).map((day) => [day.date, day])),
    [calendarQuery.data],
  );

  const totalPnl = useMemo(
    () => (calendarQuery.data ?? []).reduce((sum, day) => sum + day.pnl, 0),
    [calendarQuery.data],
  );

  const { year, month } = parseMonthKey(monthKey);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    return Array.from({ length: 7 }, (_, i) =>
      formatter.format(new Date(Date.UTC(2024, 0, i + 7))),
    );
  }, [locale]);

  const cells: (number | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      <DashboardCard>
        <DashboardCardContent className="space-y-4 pt-5">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMonthKey((prev) => shiftMonth(prev, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="font-semibold capitalize">{monthLabel}</p>
              <p
                className={cn(
                  'text-sm tabular-nums',
                  totalPnl > 0 && 'text-emerald-400',
                  totalPnl < 0 && 'text-red-400',
                  totalPnl === 0 && 'text-muted-foreground',
                )}
              >
                {formatSignedCurrency(totalPnl, 'USDT')}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMonthKey((prev) => shiftMonth(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-xs">
            {weekdayLabels.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} />;

              const date = `${monthKey}-${String(day).padStart(2, '0')}`;
              const summary = pnlByDate.get(date);

              return (
                <div
                  key={date}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-xs',
                    !summary && 'text-muted-foreground',
                    summary && summary.pnl > 0 && 'bg-emerald-500/15 text-emerald-400',
                    summary && summary.pnl < 0 && 'bg-red-500/15 text-red-400',
                    summary && summary.pnl === 0 && 'bg-secondary text-foreground/70',
                  )}
                >
                  <span>{day}</span>
                  {summary ? (
                    <span className="font-medium tabular-nums">{Math.round(summary.pnl)}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
