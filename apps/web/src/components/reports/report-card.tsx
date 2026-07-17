'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import type { AiReport } from '@/types/ai-report';

type ReportCardProps = {
  report: AiReport;
};

export function ReportCard({ report }: ReportCardProps) {
  const t = useTranslations('reports');
  const [expanded, setExpanded] = useState(false);

  const periodLabel = formatPeriod(report.type, report.periodStart, report.periodEnd);

  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t(`types.${report.type}`)}</Badge>
              <span className="text-muted-foreground text-xs">{periodLabel}</span>
            </div>
            <h3 className="text-base font-semibold">{report.title}</h3>
          </div>
        </div>

        <p
          className={
            expanded
              ? 'text-muted-foreground text-sm'
              : 'text-muted-foreground line-clamp-2 text-sm'
          }
        >
          {report.summary}
        </p>

        <Button size="sm" variant="ghost" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? t('collapse') : t('expand')}
        </Button>
      </DashboardCardContent>
    </DashboardCard>
  );
}

function formatPeriod(type: AiReport['type'], periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart);

  if (type === 'DAILY') {
    return start.toLocaleDateString();
  }

  const end = new Date(new Date(periodEnd).getTime() - 1);
  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}
