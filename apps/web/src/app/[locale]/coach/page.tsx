import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { CoachInsightsList } from '@/components/coach';

type CoachPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CoachPage({ params }: CoachPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <CoachInsightsList />
    </AuthGuard>
  );
}
