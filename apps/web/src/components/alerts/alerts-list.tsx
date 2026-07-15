'use client';

import { useTranslations } from 'next-intl';
import { useAlertsQuery } from '@/hooks/use-alerts-query';
import { AlertCard } from './alert-card';
import { CreateAlertDialog } from './create-alert-dialog';

export function AlertsList() {
  const t = useTranslations('alerts');
  const alertsQuery = useAlertsQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <CreateAlertDialog />
      </div>

      {alertsQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : alertsQuery.data && alertsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {alertsQuery.data.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
