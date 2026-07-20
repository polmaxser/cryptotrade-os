'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminEconomicEventsQuery } from '@/hooks/use-admin-economic-events-query';
import { deleteAdminEconomicEvent } from '@/lib/api/admin';
import type { EconomicEventCategory } from '@/types/economic-event';
import { AdminEconomicEventDialog } from './admin-economic-event-dialog';

const CATEGORIES: EconomicEventCategory[] = ['FOMC', 'CPI', 'NFP'];
const RANGE_DAYS_BACK = 90;
const RANGE_DAYS_FORWARD = 365;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function AdminEconomicEventsTab() {
  const t = useTranslations('admin.economicEvents');
  const tCategories = useTranslations('economicCalendar.categories');
  const tImportance = useTranslations('economicCalendar.importance');
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<EconomicEventCategory | undefined>(undefined);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - RANGE_DAYS_BACK),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + RANGE_DAYS_BACK + RANGE_DAYS_FORWARD);
    return { from: toDateKey(start), to: toDateKey(end) };
  }, []);

  const eventsQuery = useAdminEconomicEventsQuery(from, to, category);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminEconomicEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'economic-events'] });
      queryClient.invalidateQueries({ queryKey: ['economic-calendar'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
              {tCategories(c)}
            </Button>
          ))}
        </div>
        <AdminEconomicEventDialog>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newEvent')}
          </Button>
        </AdminEconomicEventDialog>
      </div>

      {eventsQuery.isLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : eventsQuery.isError ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('loadError')}</p>
      ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
        <div className="border-border/60 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/60 text-muted-foreground border-b text-left text-xs uppercase">
                <th className="px-4 py-3 font-medium">{t('columnDate')}</th>
                <th className="px-4 py-3 font-medium">{t('columnCategory')}</th>
                <th className="px-4 py-3 font-medium">{t('columnTitle')}</th>
                <th className="px-4 py-3 font-medium">{t('columnActual')}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {eventsQuery.data.map((event) => (
                <tr key={event.id} className="border-border/40 border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(event.eventDate).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge>{tCategories(event.category)}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {tImportance(event.importance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{event.title}</td>
                  <td className="px-4 py-3">{event.actual ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <AdminEconomicEventDialog event={event}>
                      <Button size="sm" variant="ghost">
                        {t('edit')}
                      </Button>
                    </AdminEconomicEventDialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(event.id)}
                    >
                      {t('delete')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
