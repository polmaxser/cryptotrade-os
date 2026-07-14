import { getApiUrl } from '@/lib/utils';
import type {
  AuthResponse,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  TwoFactorSetup,
} from '@/types/auth';
import { apiFetch } from './client';
import { ApiError } from './errors';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? 'Request failed');
  }

  return body as T;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(getApiUrl('/auth/register'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<AuthResponse>(response);
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const response = await fetch(getApiUrl('/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<LoginResult>(response);
}

export async function verifyTwoFactorRequest(
  challengeToken: string,
  code: string,
): Promise<AuthResponse> {
  const response = await fetch(getApiUrl('/auth/2fa/verify'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken, code }),
  });

  return parseJsonResponse<AuthResponse>(response);
}

export async function refreshRequest(): Promise<AuthResponse> {
  const response = await fetch(getApiUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
  });

  return parseJsonResponse<AuthResponse>(response);
}

export async function logoutRequest(): Promise<void> {
  await fetch(getApiUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
}

export async function setupTwoFactorRequest(): Promise<TwoFactorSetup> {
  return apiFetch<TwoFactorSetup>('/auth/2fa/setup', { method: 'POST' });
}

export async function enableTwoFactorRequest(code: string): Promise<void> {
  await apiFetch<{ success: true }>('/auth/2fa/enable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function disableTwoFactorRequest(code: string): Promise<void> {
  await apiFetch<{ success: true }>('/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}
