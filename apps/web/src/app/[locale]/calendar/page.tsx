import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { CalendarView } from '@/components/calendar';

type CalendarPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <CalendarView />
    </AuthGuard>
  );
}
