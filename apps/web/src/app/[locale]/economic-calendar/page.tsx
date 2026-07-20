import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { EconomicCalendarList } from '@/components/economic-calendar';

type EconomicCalendarPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function EconomicCalendarPage({ params }: EconomicCalendarPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <EconomicCalendarList />
    </AuthGuard>
  );
}
