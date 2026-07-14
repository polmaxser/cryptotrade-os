import { getApiUrl } from '@/lib/utils';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth';
import { ApiError } from './errors';

async function parseAuthResponse(response: Response): Promise<AuthResponse> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? 'Request failed');
  }

  return body as AuthResponse;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(getApiUrl('/auth/register'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseAuthResponse(response);
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(getApiUrl('/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseAuthResponse(response);
}

export async function refreshRequest(): Promise<AuthResponse> {
  const response = await fetch(getApiUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
  });

  return parseAuthResponse(response);
}

export async function logoutRequest(): Promise<void> {
  await fetch(getApiUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
}
