'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminUsersQuery } from '@/hooks/use-admin-users-query';
import { setAdminUserStatus } from '@/lib/api/admin';
import { useAuthStore } from '@/stores/auth-store';

export function AdminUsersTab() {
  const t = useTranslations('admin.users');
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const usersQuery = useAdminUsersQuery(search, page);

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      setAdminUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const totalPages = usersQuery.data
    ? Math.max(1, Math.ceil(usersQuery.data.total / usersQuery.data.pageSize))
    : 1;

  return (
    <div className="space-y-4">
      <Input
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        className="max-w-sm"
      />

      {usersQuery.isLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : usersQuery.isError ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('loadError')}</p>
      ) : usersQuery.data && usersQuery.data.items.length > 0 ? (
        <>
          <div className="border-border/60 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/60 text-muted-foreground border-b text-left text-xs uppercase">
                  <th className="px-4 py-3 font-medium">{t('columnEmail')}</th>
                  <th className="px-4 py-3 font-medium">{t('columnPlan')}</th>
                  <th className="px-4 py-3 font-medium">{t('columnStatus')}</th>
                  <th className="px-4 py-3 font-medium">{t('columnJoined')}</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.items.map((user) => (
                  <tr key={user.id} className="border-border/40 border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{user.email}</span>
                        {user.isAdmin ? <Badge variant="secondary">{t('adminBadge')}</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{user.plan ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? t('active') : t('inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={user.id === currentUserId || statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({ userId: user.id, isActive: !user.isActive })
                        }
                      >
                        {user.isActive ? t('deactivate') : t('activate')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {t('pageInfo', { page, totalPages, total: usersQuery.data.total })}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('prev')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
