import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { BillingCard } from '@/components/settings/billing-card';
import { TwoFactorCard } from '@/components/settings/two-factor-card';

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('settings');

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>

        <BillingCard />
        <TwoFactorCard />
      </div>
    </AuthGuard>
  );
}
