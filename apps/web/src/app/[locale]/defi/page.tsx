import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { DeFiPositionsList } from '@/components/defi';

type DeFiPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DeFiPage({ params }: DeFiPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <DeFiPositionsList />
    </AuthGuard>
  );
}
