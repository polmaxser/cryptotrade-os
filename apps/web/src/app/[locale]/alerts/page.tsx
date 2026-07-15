import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { AlertsList } from '@/components/alerts';

type AlertsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <AlertsList />
    </AuthGuard>
  );
}
