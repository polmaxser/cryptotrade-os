'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';

type AdminGuardProps = {
  children: ReactNode;
};

/** Gates admin-only content behind an authenticated session with isAdmin. */
export function AdminGuard({ children }: AdminGuardProps) {
  const t = useTranslations('admin');
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user && !user.isAdmin) {
      router.replace('/');
    }
  }, [status, user, router]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">{t('notAuthorized')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
