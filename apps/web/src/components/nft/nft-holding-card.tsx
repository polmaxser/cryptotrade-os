'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { deleteNftHolding } from '@/lib/api/nft-holdings';
import { QUERY_KEYS } from '@/lib/constants';
import { formatCurrency } from '@/lib/dashboard/formatters';
import type { NftHolding } from '@/types/nft-holding';
import { NftHoldingDialog } from './nft-holding-dialog';

type NftHoldingCardProps = {
  holding: NftHolding;
};

export function NftHoldingCard({ holding }: NftHoldingCardProps) {
  const t = useTranslations('nft');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteNftHolding(holding.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nftHoldings }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          {holding.imageUrl ? (
            <img
              src={holding.imageUrl}
              alt=""
              className="border-border/60 h-12 w-12 rounded-lg border object-cover"
            />
          ) : null}
          <div className="space-y-1">
            <p className="font-medium">{holding.collectionName}</p>
            <p className="text-muted-foreground text-xs">#{holding.tokenId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {holding.currentFloorPriceUsd !== null ? (
            <div className="text-right">
              <p className="font-semibold tabular-nums">
                {formatCurrency(Number(holding.currentFloorPriceUsd), 'USD')}
              </p>
              <p className="text-muted-foreground text-xs">{t('floorLabel')}</p>
            </div>
          ) : null}
          <NftHoldingDialog holding={holding}>
            <Button size="sm" variant="outline">
              {t('edit')}
            </Button>
          </NftHoldingDialog>
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
