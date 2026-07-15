import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { JournalList } from '@/components/journal';

type JournalPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function JournalPage({ params }: JournalPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <JournalList />
    </AuthGuard>
  );
}
