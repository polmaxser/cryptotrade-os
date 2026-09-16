import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { MarketOverviewPage } from '@/components/market-overview';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <MarketOverviewPage />
    </AuthGuard>
  );
}
