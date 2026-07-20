import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { BacktestsList } from '@/components/backtests';

type BacktestsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BacktestsPage({ params }: BacktestsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <BacktestsList />
    </AuthGuard>
  );
}
