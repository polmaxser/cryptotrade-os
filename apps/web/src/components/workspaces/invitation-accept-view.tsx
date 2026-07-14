'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvitationPreviewQuery } from '@/hooks/use-invitation-preview-query';
import { useAuthStore } from '@/stores/auth-store';
import { acceptInvitation } from '@/lib/api/workspaces';
import { ApiError } from '@/lib/api/errors';

type InvitationAcceptViewProps = {
  token: string;
};

export function InvitationAcceptView({ token }: InvitationAcceptViewProps) {
  const t = useTranslations('workspaces.acceptInvitation');
  const tRoles = useTranslations('workspaces.roles');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  const previewQuery = useInvitationPreviewQuery(token);
  const [error, setError] = useState<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvitation(token),
    onSuccess: (workspace) => {
      router.push(`/workspaces/${workspace.id}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.18),transparent)]" />

      <Card className="border-border/60 bg-card/40 relative w-full max-w-md backdrop-blur-xl">
        <CardHeader className="space-y-1.5 text-center">
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {previewQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <div className="border-muted-foreground/30 border-t-foreground h-6 w-6 animate-spin rounded-full border-2" />
            </div>
          ) : previewQuery.isError || !previewQuery.data ? (
            <CardDescription className="text-center">{t('notFound')}</CardDescription>
          ) : previewQuery.data.expired ? (
            <CardDescription className="text-center">{t('expired')}</CardDescription>
          ) : (
            <>
              <CardDescription className="text-center">
                {t('description', {
                  workspace: previewQuery.data.workspaceName,
                  role: tRoles(previewQuery.data.role),
                  inviter: previewQuery.data.invitedByName ?? previewQuery.data.invitedByEmail,
                })}
              </CardDescription>

              {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}

              {status === 'authenticated' ? (
                <Button
                  className="w-full"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? t('accepting') : t('accept')}
                </Button>
              ) : status === 'idle' ? (
                <div className="flex justify-center py-2">
                  <div className="border-muted-foreground/30 border-t-foreground h-5 w-5 animate-spin rounded-full border-2" />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-center text-sm">{t('needAuth')}</p>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href="/login">{t('login')}</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/register">{t('register')}</Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
