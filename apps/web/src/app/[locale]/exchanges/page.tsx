import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { ExchangesList } from '@/components/exchanges';

type ExchangesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ExchangesPage({ params }: ExchangesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <ExchangesList />
    </AuthGuard>
  );
}
