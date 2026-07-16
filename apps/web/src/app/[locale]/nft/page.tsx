import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { NftHoldingsList } from '@/components/nft';

type NftPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NftPage({ params }: NftPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <NftHoldingsList />
    </AuthGuard>
  );
}
