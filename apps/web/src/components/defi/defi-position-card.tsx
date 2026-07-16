'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { deleteDeFiPosition } from '@/lib/api/defi-positions';
import { QUERY_KEYS } from '@/lib/constants';
import { formatCurrency } from '@/lib/dashboard/formatters';
import type { DeFiPosition } from '@/types/defi-position';
import { DeFiPositionDialog } from './defi-position-dialog';

type DeFiPositionCardProps = {
  position: DeFiPosition;
};

export function DeFiPositionCard({ position }: DeFiPositionCardProps) {
  const t = useTranslations('defi');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteDeFiPosition(position.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defiPositions }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="flex items-center justify-between gap-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{position.protocol}</p>
            <Badge variant="secondary">{t(`dialog.types.${position.type}`)}</Badge>
            {position.closedAt ? <Badge variant="outline">{t('closed')}</Badge> : null}
          </div>
          <p className="text-muted-foreground text-xs">
            {position.asset} · {position.amount}
            {position.apy !== null ? ` · APY ${position.apy}%` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="font-semibold tabular-nums">
            {formatCurrency(Number(position.valueUsd), 'USD')}
          </p>
          <DeFiPositionDialog position={position}>
            <Button size="sm" variant="outline">
              {t('edit')}
            </Button>
          </DeFiPositionDialog>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {t('delete')}
          </Button>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
