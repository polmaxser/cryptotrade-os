import { Badge } from '@/components/ui/badge';
import { formatSignedPnl } from '@/lib/dashboard/formatters';
import type { DashboardTrade } from '@/types/dashboard';
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from './dashboard-card';

type RecentTradesCardProps = {
  trades: DashboardTrade[];
  title: string;
};

export function RecentTradesCard({ trades, title }: RecentTradesCardProps) {
  return (
    <DashboardCard className="h-full">
      <DashboardCardHeader title={title} />
      <DashboardCardContent className="pt-4">
        <ul className="space-y-3">
          {trades.map((trade) => {
            const isPositive = trade.pnl > 0;
            const isNegative = trade.pnl < 0;

            return (
              <li
                key={trade.id}
                className="border-border/50 bg-background/30 flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <Badge variant="secondary" className="font-mono text-xs">
                  {trade.symbol}
                </Badge>
                <span
                  className={
                    isPositive
                      ? 'font-semibold tabular-nums text-emerald-400'
                      : isNegative
                        ? 'font-semibold tabular-nums text-red-400'
                        : 'text-muted-foreground font-semibold tabular-nums'
                  }
                >
                  {formatSignedPnl(trade.pnl)}
                </span>
              </li>
            );
          })}
        </ul>
      </DashboardCardContent>
    </DashboardCard>
  );
}
