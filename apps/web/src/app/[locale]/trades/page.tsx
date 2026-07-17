import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { TradesList } from '@/components/trades';

type TradesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TradesPage({ params }: TradesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <TradesList />
    </AuthGuard>
  );
}
