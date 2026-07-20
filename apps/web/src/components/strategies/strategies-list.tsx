'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStrategiesQuery } from '@/hooks/use-strategies-query';
import { StrategyCard } from './strategy-card';
import { StrategyDialog } from './strategy-dialog';

export function StrategiesList() {
  const t = useTranslations('strategies');
  const strategiesQuery = useStrategiesQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <StrategyDialog>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newStrategy')}
          </Button>
        </StrategyDialog>
      </div>

      {strategiesQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : strategiesQuery.isError ? (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('loadError')}</p>
      ) : strategiesQuery.data && strategiesQuery.data.length > 0 ? (
        <div className="space-y-3">
          {strategiesQuery.data.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
