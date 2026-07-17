'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCoachInsightsQuery } from '@/hooks/use-coach-insights-query';
import { CoachInsightCard } from './coach-insight-card';

const WIDGET_LIMIT = 3;

/**
 * Compact "Coach Insights" section for Dashboard/Journal — surfaces at most
 * WIDGET_LIMIT new findings. Renders nothing while loading, on error (covers
 * non-Premium users, since the endpoint 403s for them — no upsell nag here),
 * or when there's nothing new to show.
 */
export function CoachInsightsWidget() {
  const t = useTranslations('coach.widget');
  const insightsQuery = useCoachInsightsQuery('NEW');

  if (insightsQuery.isLoading || insightsQuery.isError) {
    return null;
  }

  const insights = (insightsQuery.data ?? []).slice(0, WIDGET_LIMIT);

  if (insights.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
        <Link href="/coach" className="text-muted-foreground hover:text-foreground text-sm">
          {t('viewAll')}
        </Link>
      </div>
      <div className="space-y-3">
        {insights.map((insight) => (
          <CoachInsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}
