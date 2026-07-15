'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { removeWatchlistItem } from '@/lib/api/watchlist';
import { QUERY_KEYS } from '@/lib/constants';
import { formatCurrency, formatPercent } from '@/lib/dashboard/formatters';
import { cn } from '@/lib/utils';
import type { WatchlistItem } from '@/types/watchlist';

type WatchlistItemCardProps = {
  item: WatchlistItem;
};

export function WatchlistItemCard({ item }: WatchlistItemCardProps) {
  const t = useTranslations('watchlist');
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: () => removeWatchlistItem(item.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.watchlist }),
  });

  const isPositive = (item.change24h ?? 0) > 0;
  const isNegative = (item.change24h ?? 0) < 0;

  return (
    <DashboardCard>
      <DashboardCardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-muted-foreground text-xs uppercase">{item.symbol}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-semibold tabular-nums">
              {item.price !== null ? formatCurrency(item.price, 'USD') : '—'}
            </p>
            <p
              className={cn(
                'text-xs tabular-nums',
                isPositive && 'text-emerald-400',
                isNegative && 'text-red-400',
                !isPositive && !isNegative && 'text-muted-foreground',
              )}
            >
              {item.change24h !== null
                ? `${item.change24h > 0 ? '+' : ''}${formatPercent(item.change24h)}`
                : '—'}
            </p>
          </div>
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
