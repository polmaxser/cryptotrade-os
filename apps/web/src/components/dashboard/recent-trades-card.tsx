import { Badge } from '@/components/ui/badge';
import { formatSignedPnl } from '@/lib/dashboard/formatters';
import type { Trade } from '@/types/trade';
import { DashboardCard, DashboardCardContent, DashboardCardHeader } from './dashboard-card';

const RECENT_TRADES_LIMIT = 5;

type RecentTradesCardProps = {
  trades: Trade[];
  title: string;
  openLabel: string;
};

export function RecentTradesCard({ trades, title, openLabel }: RecentTradesCardProps) {
  const recentTrades = trades.slice(0, RECENT_TRADES_LIMIT);

  return (
    <DashboardCard className="h-full">
      <DashboardCardHeader title={title} />
      <DashboardCardContent className="pt-4">
        <ul className="space-y-3">
          {recentTrades.map((trade) => {
            const pnl = trade.pnl !== null ? Number(trade.pnl) : null;
            const isPositive = pnl !== null && pnl > 0;
            const isNegative = pnl !== null && pnl < 0;

            return (
              <li
                key={trade.id}
                className="border-border/50 bg-background/30 flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <Badge variant="secondary" className="font-mono text-xs">
                  {trade.symbol}
                </Badge>
                {pnl !== null ? (
                  <span
                    className={
                      isPositive
                        ? 'font-semibold tabular-nums text-emerald-400'
                        : isNegative
                          ? 'font-semibold tabular-nums text-red-400'
                          : 'text-muted-foreground font-semibold tabular-nums'
                    }
                  >
                    {formatSignedPnl(pnl)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">{openLabel}</span>
                )}
              </li>
            );
          })}
        </ul>
      </DashboardCardContent>
    </DashboardCard>
  );
}
