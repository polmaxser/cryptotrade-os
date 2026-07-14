'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';

type GuestOnlyProps = {
  children: ReactNode;
};

/** Bounces already-authenticated visitors away from /login and /register. */
export function GuestOnly({ children }: GuestOnlyProps) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  if (status === 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
