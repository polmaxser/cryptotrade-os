import { getApiUrl } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { refreshRequest } from './auth';
import { ApiError } from './errors';

let refreshPromise: Promise<boolean> | null = null;

/**
 * De-duplicates concurrent 401s (e.g. two queries firing on mount after the
 * access token expired) into a single /auth/refresh call.
 */
function ensureFreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshRequest()
      .then((res) => {
        useAuthStore.getState().setSession(res.user, res.accessToken);
        return true;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  allowRefreshRetry = true,
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(getApiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && allowRefreshRetry) {
    const refreshed = await ensureFreshSession();

    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
