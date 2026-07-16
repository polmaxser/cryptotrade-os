'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoachInsightsQuery } from '@/hooks/use-coach-insights-query';
import { analyzeNow } from '@/lib/api/coach-insights';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { CoachInsightCard } from './coach-insight-card';

export function CoachInsightsList() {
  const t = useTranslations('coach');
  const queryClient = useQueryClient();
  const insightsQuery = useCoachInsightsQuery();
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: analyzeNow,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coachInsights() });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('analyzeError')),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending || insightsQuery.isError}
        >
          <Sparkles className="h-4 w-4" />
          {analyzeMutation.isPending ? t('analyzing') : t('analyzeNow')}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {insightsQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : insightsQuery.isError ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {insightsQuery.error instanceof ApiError
            ? insightsQuery.error.message
            : t('analyzeError')}
        </p>
      ) : insightsQuery.data && insightsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {insightsQuery.data.map((insight) => (
            <CoachInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
