'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeFiPositionsQuery } from '@/hooks/use-defi-positions-query';
import { DeFiPositionCard } from './defi-position-card';
import { DeFiPositionDialog } from './defi-position-dialog';

export function DeFiPositionsList() {
  const t = useTranslations('defi');
  const positionsQuery = useDeFiPositionsQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <DeFiPositionDialog>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newPosition')}
          </Button>
        </DeFiPositionDialog>
      </div>

      {positionsQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : positionsQuery.data && positionsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {positionsQuery.data.map((position) => (
            <DeFiPositionCard key={position.id} position={position} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
