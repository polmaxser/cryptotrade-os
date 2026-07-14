'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/dashboard-card';
import { useWorkspacesQuery } from '@/hooks/use-workspaces-query';
import { CreateWorkspaceDialog } from './create-workspace-dialog';

export function WorkspacesList() {
  const t = useTranslations('workspaces');
  const workspacesQuery = useWorkspacesQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {workspacesQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : workspacesQuery.data && workspacesQuery.data.length > 0 ? (
        <ul className="space-y-3">
          {workspacesQuery.data.map((workspace) => (
            <li key={workspace.id}>
              <Link href={`/workspaces/${workspace.id}`}>
                <DashboardCard className="hover:border-border transition-colors">
                  <DashboardCardContent className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{workspace.name}</p>
                      <p className="text-muted-foreground text-sm">{workspace.slug}</p>
                    </div>
                    <Badge variant="secondary">{workspace.role}</Badge>
                  </DashboardCardContent>
                </DashboardCard>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
