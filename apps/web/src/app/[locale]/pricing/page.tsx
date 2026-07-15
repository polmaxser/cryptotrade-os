import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PricingPlans } from '@/components/billing/pricing-plans';

type PricingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pricing');

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="text-muted-foreground text-base sm:text-lg">{t('subtitle')}</p>
      </div>

      <PricingPlans />
    </div>
  );
}
