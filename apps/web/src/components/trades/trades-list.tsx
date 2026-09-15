'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useTradesQuery } from '@/hooks/use-trades-query';
import { NewTradeDialog } from './new-trade-dialog';
import { TradesTable } from './trades-table';

const PAGE_SIZE = 50;

export function TradesList() {
  const t = useTranslations('trades.list');
  const [page, setPage] = useState(1);
  const tradesQuery = useTradesQuery(page, PAGE_SIZE);

  const totalPages = tradesQuery.data
    ? Math.max(1, Math.ceil(tradesQuery.data.total / tradesQuery.data.pageSize))
    : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <NewTradeDialog />
      </div>

      {tradesQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : tradesQuery.data && tradesQuery.data.items.length > 0 ? (
        <>
          <TradesTable trades={tradesQuery.data.items} />

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {t('pageInfo', { page, totalPages, total: tradesQuery.data.total })}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('prev')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
