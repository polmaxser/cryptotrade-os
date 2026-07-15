'use client';

import { useTranslations } from 'next-intl';
import { useExchangeConnectionsQuery } from '@/hooks/use-exchange-connections-query';
import { ConnectExchangeDialog } from './connect-exchange-dialog';
import { ExchangeConnectionCard } from './exchange-connection-card';

export function ExchangesList() {
  const t = useTranslations('exchanges');
  const connectionsQuery = useExchangeConnectionsQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <ConnectExchangeDialog />
      </div>

      {connectionsQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : connectionsQuery.data && connectionsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {connectionsQuery.data.map((connection) => (
            <ExchangeConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
