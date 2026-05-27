import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, setAuthToken, setUnauthorizedHandler, ApiError } from './http';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    setAuthToken(null);
    setUnauthorizedHandler(null);
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('GET 은 base URL 에 path 를 붙이고 JSON 을 반환한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: 1 }));
    const data = await apiFetch<{ ok: number }>('/users/me');
    expect(data).toEqual({ ok: 1 });
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/users/me');
    expect((init as RequestInit).method).toBe('GET');
  });

  it('토큰이 있으면 Authorization 헤더를 주입한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));
    setAuthToken('jwt-123');
    await apiFetch('/users/me');
    const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-123');
  });

  it('auth:false 면 토큰을 안 붙이고 body 를 JSON 직렬화한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));
    setAuthToken('jwt-123');
    await apiFetch('/auth/kakao', { method: 'POST', body: { code: 'C' }, auth: false });
    const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    expect(init.body).toBe(JSON.stringify({ code: 'C' }));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('비2xx 면 서버 message 로 ApiError 를 던진다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ status: 400, error: 'Bad Request', message: '상품명은 필수입니다' }, 400),
    );
    await expect(apiFetch('/splits')).rejects.toMatchObject({ status: 400, message: '상품명은 필수입니다' });
    await expect(apiFetch('/splits')).rejects.toBeInstanceOf(ApiError);
  });

  it('401 이면 onUnauthorized 콜백을 호출한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ message: '인증 필요' }, 401));
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    await expect(apiFetch('/users/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
