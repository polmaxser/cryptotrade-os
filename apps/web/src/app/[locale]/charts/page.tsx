import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { ChartView } from '@/components/charts';

type ChartsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ChartsPage({ params }: ChartsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <ChartView />
    </AuthGuard>
  );
}
