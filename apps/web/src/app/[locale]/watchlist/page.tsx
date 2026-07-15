import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { WatchlistList } from '@/components/watchlist';

type WatchlistPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WatchlistPage({ params }: WatchlistPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <WatchlistList />
    </AuthGuard>
  );
}
