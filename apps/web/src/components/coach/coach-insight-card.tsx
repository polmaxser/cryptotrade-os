'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { updateCoachInsightStatus } from '@/lib/api/coach-insights';
import { QUERY_KEYS } from '@/lib/constants';
import type { CoachInsight } from '@/types/coach-insight';

type CoachInsightCardProps = {
  insight: CoachInsight;
};

export function CoachInsightCard({ insight }: CoachInsightCardProps) {
  const t = useTranslations('coach');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (status: 'CONFIRMED' | 'DISMISSED') => updateCoachInsightStatus(insight.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coachInsights() }),
  });

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {t(`patterns.${insight.pattern}`)}
            </p>
            <h3 className="text-base font-semibold">{insight.title}</h3>
          </div>
          <Badge
            variant={
              insight.status === 'CONFIRMED'
                ? 'success'
                : insight.status === 'DISMISSED'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {t(`status.${insight.status}`)}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm">{insight.description}</p>

        <div className="text-muted-foreground text-xs">
          {t('relatedTrades', { count: insight.relatedTradeIds.length })}
        </div>

        {insight.status === 'NEW' ? (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateMutation.mutate('CONFIRMED')}
              disabled={updateMutation.isPending}
            >
              {t('confirm')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateMutation.mutate('DISMISSED')}
              disabled={updateMutation.isPending}
            >
              {t('dismiss')}
            </Button>
          </div>
        ) : null}
      </DashboardCardContent>
    </DashboardCard>
  );
}
