import { setRequestLocale } from 'next-intl/server';
import { AuthGuard } from '@/components/auth';
import { WorkspaceDetail } from '@/components/workspaces/workspace-detail';

type WorkspaceDetailPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export default async function WorkspaceDetailPage({ params }: WorkspaceDetailPageProps) {
  const { locale, workspaceId } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <WorkspaceDetail workspaceId={workspaceId} />
    </AuthGuard>
  );
}
