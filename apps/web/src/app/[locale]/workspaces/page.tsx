import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { WorkspacesList } from '@/components/workspaces/workspaces-list';

type WorkspacesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WorkspacesPage({ params }: WorkspacesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <WorkspacesList />
    </AuthGuard>
  );
}
