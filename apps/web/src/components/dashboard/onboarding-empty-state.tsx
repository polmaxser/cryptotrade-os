import { CandlestickChart, Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { NewTradeDialog } from '@/components/trades';
import { DashboardCard } from './dashboard-card';

/**
 * Shown instead of the (all-zero, not-yet-meaningful) stats/analytics grid
 * for a brand-new user with zero trades — a blank dashboard with a "no
 * recent trades" line was the only signal they got before this.
 */
export function OnboardingEmptyState() {
  const t = useTranslations('dashboard.onboarding');

  return (
    <div className="space-y-8 py-8">
      <div className="mx-auto max-w-md space-y-2 text-center">
        <h2 className="text-xl font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
        <Link href="/exchanges" className="block h-full">
          <DashboardCard className="hover:border-border flex h-full flex-col gap-3 p-6 transition-colors">
            <div className="bg-primary/10 ring-border/60 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
              <Link2 className="text-primary h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{t('connectExchange.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('connectExchange.description')}</p>
            </div>
          </DashboardCard>
        </Link>

        <DashboardCard className="flex h-full flex-col gap-3 p-6">
          <div className="bg-primary/10 ring-border/60 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
            <CandlestickChart className="text-primary h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">{t('logTrade.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('logTrade.description')}</p>
          </div>
          <div className="mt-auto pt-1">
            <NewTradeDialog />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
