'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteTrade } from '@/lib/api/trades';
import { QUERY_KEYS } from '@/lib/constants';
import { formatSignedPnl } from '@/lib/dashboard/formatters';
import type { Trade } from '@/types/trade';
import { EditTradeDialog } from './edit-trade-dialog';

type TradesTableProps = {
  trades: Trade[];
};

export function TradesTable({ trades }: TradesTableProps) {
  const t = useTranslations('trades.list');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trades });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
    },
  });

  return (
    <div className="border-border/60 overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border/60 text-muted-foreground border-b text-left text-xs uppercase">
            <th className="px-4 py-3 font-medium">{t('columnSymbol')}</th>
            <th className="px-4 py-3 font-medium">{t('columnSide')}</th>
            <th className="px-4 py-3 font-medium">{t('columnEntry')}</th>
            <th className="px-4 py-3 font-medium">{t('columnExit')}</th>
            <th className="px-4 py-3 font-medium">{t('columnQuantity')}</th>
            <th className="px-4 py-3 font-medium">{t('columnPnl')}</th>
            <th className="px-4 py-3 font-medium">{t('columnStatus')}</th>
            <th className="px-4 py-3 font-medium">{t('columnOpenedAt')}</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const pnl = trade.pnl !== null ? Number(trade.pnl) : null;

            return (
              <tr key={trade.id} className="border-border/40 border-b last:border-0">
                <td className="px-4 py-3 font-mono font-medium">{trade.symbol}</td>
                <td className="px-4 py-3">
                  <Badge variant={trade.side === 'LONG' ? 'success' : 'danger'}>
                    {trade.side === 'LONG' ? t('sideLong') : t('sideShort')}
                  </Badge>
                </td>
                <td className="px-4 py-3 tabular-nums">{trade.entryPrice}</td>
                <td className="px-4 py-3 tabular-nums">{trade.exitPrice ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{trade.quantity}</td>
                <td className="px-4 py-3 tabular-nums">
                  {pnl !== null ? (
                    <span className={pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatSignedPnl(pnl)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={trade.status === 'OPEN' ? 'outline' : 'secondary'}>
                    {trade.status === 'OPEN' ? t('statusOpen') : t('statusClosed')}
                  </Badge>
                </td>
                <td className="text-muted-foreground whitespace-nowrap px-4 py-3">
                  {new Date(trade.openedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <EditTradeDialog trade={trade}>
                      <Button size="sm" variant="outline">
                        {t('edit')}
                      </Button>
                    </EditTradeDialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(trade.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
