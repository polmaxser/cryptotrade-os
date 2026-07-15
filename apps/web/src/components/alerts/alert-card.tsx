'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { removeAlert } from '@/lib/api/alerts';
import { QUERY_KEYS } from '@/lib/constants';
import { formatCurrency } from '@/lib/dashboard/formatters';
import type { PriceAlert } from '@/types/alert';

type AlertCardProps = {
  alert: PriceAlert;
};

export function AlertCard({ alert }: AlertCardProps) {
  const t = useTranslations('alerts');
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: () => removeAlert(alert.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          {alert.direction === 'ABOVE' ? (
            <ArrowUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <ArrowDown className="h-4 w-4 text-red-400" />
          )}
          <div>
            <p className="font-medium">{alert.symbol}</p>
            <p className="text-muted-foreground text-xs">
              {alert.direction === 'ABOVE' ? t('aboveLabel') : t('belowLabel')}{' '}
              {formatCurrency(Number(alert.targetPrice), 'USD')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={alert.status === 'TRIGGERED' ? 'success' : 'outline'}>
            {alert.status === 'TRIGGERED' ? t('triggered') : t('active')}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
          >
            {t('remove')}
          </Button>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
