'use client';

import { useEffect, type ReactNode } from 'react';
import { refreshRequest } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Restores the session on first load by attempting a silent /auth/refresh —
 * the access token lives only in memory, so a page reload always starts
 * with an empty store and relies on the httpOnly refresh cookie to recover it.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    let cancelled = false;

    refreshRequest()
      .then((res) => {
        if (!cancelled) {
          useAuthStore.getState().setSession(res.user, res.accessToken);
        }
      })
      .catch(() => {
        if (!cancelled) {
          useAuthStore.getState().clear();
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
