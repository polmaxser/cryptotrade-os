import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { Dashboard } from '@/components/dashboard';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
