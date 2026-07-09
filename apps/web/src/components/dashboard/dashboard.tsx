import { getTranslations } from 'next-intl/server';
import type { DashboardData } from '@/types/dashboard';
import { AiCoachCard } from './ai-coach-card';
import { CapitalCard } from './capital-card';
import { DailyChecklistCard } from './daily-checklist-card';
import { RecentTradesCard } from './recent-trades-card';
import { StatsGrid } from './stats-grid';

type DashboardProps = {
  data: DashboardData;
};

export async function Dashboard({ data }: DashboardProps) {
  const t = await getTranslations('dashboard');

  const checklistLabels = {
    tradingPlan: t('checklist.tradingPlan'),
    sleep: t('checklist.sleep'),
    maxTrades: t('checklist.maxTrades'),
    noRevenge: t('checklist.noRevenge'),
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(56,189,248,0.08),transparent)]" />

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>

        <section>
          <CapitalCard
            capital={data.capital}
            labels={{
              current: t('capital.current'),
              goal: t('capital.goal'),
              progress: t('capital.progress'),
            }}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsGrid
            stats={data.stats}
            labels={{
              winRate: t('stats.winRate'),
              profitFactor: t('stats.profitFactor'),
              maxDrawdown: t('stats.maxDrawdown'),
              todayRisk: t('stats.todayRisk'),
            }}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <RecentTradesCard trades={data.recentTrades} title={t('recentTrades.title')} />
          <AiCoachCard
            title={t('aiCoach.title')}
            headline={t(`aiCoach.${data.aiCoach.headline}`)}
            advice={t(`aiCoach.${data.aiCoach.advice}`)}
          />
        </section>

        <section>
          <DailyChecklistCard
            items={data.checklist}
            title={t('checklist.title')}
            itemLabels={checklistLabels}
          />
        </section>
      </div>
    </div>
  );
}
