import { cn } from '@/lib/utils';
import { DashboardCard, DashboardCardContent } from './dashboard-card';

type StatCardProps = {
  label: string;
  value: string;
  className?: string;
};

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <DashboardCard className={cn('h-full', className)}>
      <DashboardCardContent className="flex h-full flex-col justify-between gap-4 py-5">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
        <p className="text-foreground text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
          {value}
        </p>
      </DashboardCardContent>
    </DashboardCard>
  );
}
