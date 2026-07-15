import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { NotesList } from '@/components/notes';

type NotesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NotesPage({ params }: NotesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <NotesList />
    </AuthGuard>
  );
}
