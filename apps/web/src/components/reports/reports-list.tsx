'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAiReportsQuery } from '@/hooks/use-ai-reports-query';
import { generateAiReport } from '@/lib/api/ai-reports';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import type { AiReportType } from '@/types/ai-report';
import { ReportCard } from './report-card';

const TYPES: AiReportType[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

const GENERATE_LABEL_KEYS: Record<AiReportType, string> = {
  DAILY: 'generateDaily',
  WEEKLY: 'generateWeekly',
  MONTHLY: 'generateMonthly',
};

export function ReportsList() {
  const t = useTranslations('reports');
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AiReportType | undefined>(undefined);
  const reportsQuery = useAiReportsQuery(filter);
  const [error, setError] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<AiReportType | null>(null);

  const generateMutation = useMutation({
    mutationFn: (type: AiReportType) => generateAiReport(type),
    onSuccess: () => {
      setError(null);
      setPendingType(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.aiReports() });
      for (const type of TYPES) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.aiReports(type) });
      }
    },
    onError: (err) => {
      setPendingType(null);
      setError(err instanceof ApiError ? err.message : t('generateError'));
    },
  });

  function handleGenerate(type: AiReportType) {
    setError(null);
    setPendingType(type);
    generateMutation.mutate(type);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === undefined ? 'default' : 'outline'}
          onClick={() => setFilter(undefined)}
        >
          {t('filterAll')}
        </Button>
        {TYPES.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={filter === type ? 'default' : 'outline'}
            onClick={() => setFilter(type)}
          >
            {t(`types.${type}`)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <Button
            key={type}
            size="sm"
            variant="outline"
            onClick={() => handleGenerate(type)}
            disabled={generateMutation.isPending}
          >
            {pendingType === type ? t('generating') : t(GENERATE_LABEL_KEYS[type])}
          </Button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {reportsQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : reportsQuery.isError ? (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('loadError')}</p>
      ) : reportsQuery.data && reportsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {reportsQuery.data.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
