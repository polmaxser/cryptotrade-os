import { Check } from 'lucide-react';
import type { DashboardChecklistItem } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from './dashboard-card';

type DailyChecklistCardProps = {
  items: DashboardChecklistItem[];
  title: string;
  itemLabels: Record<string, string>;
};

export function DailyChecklistCard({ items, title, itemLabels }: DailyChecklistCardProps) {
  return (
    <DashboardCard className="h-full">
      <DashboardCardHeader title={title} />
      <DashboardCardContent className="pt-4">
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-border/50 bg-background/30 flex items-center gap-3 rounded-xl border px-4 py-3"
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  item.completed
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {item.completed ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span
                className={cn(
                  'text-sm',
                  item.completed ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {itemLabels[item.labelKey] ?? item.labelKey}
              </span>
            </li>
          ))}
        </ul>
      </DashboardCardContent>
    </DashboardCard>
  );
}
