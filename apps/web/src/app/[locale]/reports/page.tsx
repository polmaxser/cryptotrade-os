import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { ReportsList } from '@/components/reports';

type ReportsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <ReportsList />
    </AuthGuard>
  );
}
