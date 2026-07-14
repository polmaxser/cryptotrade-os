import { formatPercent } from '@/lib/dashboard/formatters';
import type { AnalyticsSummary } from '@/types/analytics';
import { StatCard } from './stat-card';

type StatsGridProps = {
  summary: AnalyticsSummary;
  labels: {
    winRate: string;
    winningTrades: string;
    losingTrades: string;
    openTrades: string;
  };
};

export function StatsGrid({ summary, labels }: StatsGridProps) {
  return (
    <>
      <StatCard label={labels.winRate} value={formatPercent(summary.winRate, 0)} />
      <StatCard label={labels.winningTrades} value={String(summary.winningTrades)} />
      <StatCard label={labels.losingTrades} value={String(summary.losingTrades)} />
      <StatCard label={labels.openTrades} value={String(summary.openTrades)} />
    </>
  );
}
