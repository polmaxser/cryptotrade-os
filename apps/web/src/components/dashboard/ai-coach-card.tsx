import { Sparkles } from 'lucide-react';
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from './dashboard-card';

type AiCoachCardProps = {
  title: string;
  headline: string;
  advice: string;
};

export function AiCoachCard({ title, headline, advice }: AiCoachCardProps) {
  return (
    <DashboardCard className="border-violet-500/10 from-violet-500/5 h-full bg-gradient-to-br to-transparent">
      <DashboardCardHeader
        title={title}
        action={
          <div className="bg-violet-500/10 text-violet-300 flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
        }
      />
      <DashboardCardContent className="space-y-3 pt-4">
        <p className="text-foreground text-base leading-relaxed font-medium">{headline}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{advice}</p>
      </DashboardCardContent>
    </DashboardCard>
  );
}
