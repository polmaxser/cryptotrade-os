import { create } from 'zustand';
import type { PublicUser } from '@/types/auth';

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: PublicUser | null;
  accessToken: string | null;
  setSession: (user: PublicUser, accessToken: string) => void;
  setUser: (user: PublicUser) => void;
  clear: () => void;
};

/**
 * Deliberately not persisted (no zustand `persist`): the access token must
 * never touch localStorage. Sessions are restored on load via a silent
 * `/auth/refresh` call using the httpOnly cookie — see AuthProvider.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'idle',
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ status: 'authenticated', user, accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ status: 'unauthenticated', user: null, accessToken: null }),
}));
