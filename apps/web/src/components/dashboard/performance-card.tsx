import { Progress } from '@/components/ui/progress';
import { formatPercent, formatSignedCurrency } from '@/lib/dashboard/formatters';
import type { AnalyticsSummary } from '@/types/analytics';
import { DashboardCard, DashboardCardContent } from './dashboard-card';

type PerformanceCardProps = {
  summary: AnalyticsSummary;
  labels: {
    totalPnl: string;
    roi: string;
    winRate: string;
  };
};

export function PerformanceCard({ summary, labels }: PerformanceCardProps) {
  const isPositive = summary.totalPnl > 0;
  const isNegative = summary.totalPnl < 0;

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {labels.totalPnl}
            </p>
            <p
              className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-foreground'
              }`}
            >
              {formatSignedCurrency(summary.totalPnl, 'USDT')}
            </p>
          </div>

          <div className="space-y-2 sm:text-right">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {labels.roi}
            </p>
            <p className="text-foreground/90 text-2xl font-medium tabular-nums tracking-tight sm:text-3xl">
              {formatPercent(summary.roi)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{labels.winRate}</span>
            <span className="font-medium tabular-nums">{formatPercent(summary.winRate, 0)}</span>
          </div>
          <Progress value={summary.winRate} className="h-2.5" />
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
