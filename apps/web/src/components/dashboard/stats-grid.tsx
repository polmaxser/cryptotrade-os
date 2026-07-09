import {
  formatCurrency,
  formatDecimal,
  formatPercent,
} from '@/lib/dashboard/formatters';
import type { DashboardStats } from '@/types/dashboard';
import { StatCard } from './stat-card';

type StatsGridProps = {
  stats: DashboardStats;
  labels: {
    winRate: string;
    profitFactor: string;
    maxDrawdown: string;
    todayRisk: string;
  };
};

export function StatsGrid({ stats, labels }: StatsGridProps) {
  return (
    <>
      <StatCard label={labels.winRate} value={formatPercent(stats.winRate, 0)} />
      <StatCard label={labels.profitFactor} value={formatDecimal(stats.profitFactor)} />
      <StatCard label={labels.maxDrawdown} value={formatPercent(stats.maxDrawdown, 1)} />
      <StatCard
        label={labels.todayRisk}
        value={formatCurrency(stats.todayRisk, stats.currency)}
      />
    </>
  );
}
