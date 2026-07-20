import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { StrategiesList } from '@/components/strategies';

type StrategiesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function StrategiesPage({ params }: StrategiesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <StrategiesList />
    </AuthGuard>
  );
}
