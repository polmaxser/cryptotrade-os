import { apiFetch } from './client';
import { ApiError } from './errors';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthResponse } from '@/types/auth';
import * as authApi from './auth';

jest.mock('./auth');

const mockedRefreshRequest = authApi.refreshRequest as jest.MockedFunction<
  typeof authApi.refreshRequest
>;

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    useAuthStore.getState().clear();
    mockedRefreshRequest.mockReset();
  });

  it('includes the Authorization header when an access token is present', async () => {
    useAuthStore.getState().setSession({ id: 'u1' } as never, 'token-123');
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch('/trades');

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.headers.Authorization).toBe('Bearer token-123');
  });

  it('omits the Authorization header when there is no access token', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch('/trades');

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.headers.Authorization).toBeUndefined();
  });

  it('does not force a JSON content-type for FormData bodies', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch('/upload', { method: 'POST', body: new FormData() });

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.headers['Content-Type']).toBeUndefined();
  });

  it('returns undefined for a 204 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });

    const result = await apiFetch('/trades/1', { method: 'DELETE' });

    expect(result).toBeUndefined();
  });

  it('throws ApiError with the server message on a non-401 error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(500, { message: 'Something broke' }),
    );

    await expect(apiFetch('/trades')).rejects.toMatchObject(new ApiError(500, 'Something broke'));
    expect(mockedRefreshRequest).not.toHaveBeenCalled();
  });

  it('refreshes the session and retries once on a 401, returning the retried response', async () => {
    useAuthStore.getState().setSession({ id: 'u1' } as never, 'expired-token');

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { data: 'fresh' }));

    mockedRefreshRequest.mockResolvedValue({
      user: { id: 'u1' } as never,
      accessToken: 'new-token',
    });

    const result = await apiFetch<{ data: string }>('/trades');

    expect(result).toEqual({ data: 'fresh' });
    expect(useAuthStore.getState().accessToken).toBe('new-token');

    // The retried request must carry the newly refreshed token, not the expired one.
    const [, secondRequestInit] = (global.fetch as jest.Mock).mock.calls[1];
    expect(secondRequestInit.headers.Authorization).toBe('Bearer new-token');
  });

  it('clears the session and surfaces the original 401 when refresh itself fails', async () => {
    useAuthStore.getState().setSession({ id: 'u1' } as never, 'expired-token');
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(401, { message: 'Unauthorized' }));
    mockedRefreshRequest.mockRejectedValue(new ApiError(401, 'Refresh failed'));

    await expect(apiFetch('/trades')).rejects.toMatchObject(new ApiError(401, 'Unauthorized'));
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('de-duplicates concurrent 401s into a single refresh call', async () => {
    useAuthStore.getState().setSession({ id: 'u1' } as never, 'expired-token');

    (global.fetch as jest.Mock).mockImplementation(async (_url, init) => {
      const isRetry = init?.headers?.Authorization === 'Bearer new-token';
      return isRetry ? jsonResponse(200, { ok: true }) : jsonResponse(401, {});
    });

    let resolveRefresh!: (value: AuthResponse) => void;
    mockedRefreshRequest.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const first = apiFetch('/trades');
    const second = apiFetch('/portfolios');

    resolveRefresh({ user: { id: 'u1' } as never, accessToken: 'new-token' });

    await Promise.all([first, second]);

    expect(mockedRefreshRequest).toHaveBeenCalledTimes(1);
  });
});
