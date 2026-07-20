import { setRequestLocale } from 'next-intl/server';
import { AdminGuard } from '@/components/auth';
import { AdminPanel } from '@/components/admin';

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AdminGuard>
      <AdminPanel />
    </AdminGuard>
  );
}
