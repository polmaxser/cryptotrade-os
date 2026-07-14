'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';

type AuthGuardProps = {
  children: ReactNode;
};

/** Gates protected content behind an authenticated session. */
export function AuthGuard({ children }: AuthGuardProps) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  return <>{children}</>;
}
