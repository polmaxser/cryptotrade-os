'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { deleteExchangeConnection } from '@/lib/api/exchanges';
import { QUERY_KEYS } from '@/lib/constants';
import type { ExchangeConnection } from '@/types/exchange';
import { ImportTradesDialog } from './import-trades-dialog';

type ExchangeConnectionCardProps = {
  connection: ExchangeConnection;
};

export function ExchangeConnectionCard({ connection }: ExchangeConnectionCardProps) {
  const t = useTranslations('exchanges');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteExchangeConnection(connection.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exchangeConnections }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="flex items-center justify-between gap-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{connection.label}</p>
            <Badge variant="secondary">{connection.exchange}</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {t('keyPreview', { preview: connection.apiKeyPreview })}
            {connection.lastImportedAt
              ? ` · ${t('lastImported', { date: new Date(connection.lastImportedAt).toLocaleDateString() })}`
              : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ImportTradesDialog connectionId={connection.id}>
            <Button size="sm">{t('importButton')}</Button>
          </ImportTradesDialog>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {t('disconnect')}
          </Button>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
