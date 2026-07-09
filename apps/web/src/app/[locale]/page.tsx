import { setRequestLocale } from 'next-intl/server';
import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/lib/dashboard';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getDashboardData();

  return <Dashboard data={data} />;
}
