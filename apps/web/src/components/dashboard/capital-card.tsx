import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent } from '@/lib/dashboard/formatters';
import type { DashboardCapital } from '@/types/dashboard';
import {
  DashboardCard,
  DashboardCardContent,
} from './dashboard-card';

type CapitalCardProps = {
  capital: DashboardCapital;
  labels: {
    current: string;
    goal: string;
    progress: string;
  };
};

export function CapitalCard({ capital, labels }: CapitalCardProps) {
  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {labels.current}
            </p>
            <p className="text-foreground text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {formatCurrency(capital.current, capital.currency)}
            </p>
          </div>

          <div className="space-y-2 sm:text-right">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {labels.goal}
            </p>
            <p className="text-foreground/90 text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
              {formatCurrency(capital.goal, capital.currency)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{labels.progress}</span>
            <span className="font-medium tabular-nums">
              {formatPercent(capital.progressPercent)}
            </span>
          </div>
          <Progress value={capital.progressPercent} className="h-2.5" />
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
