import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./http', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from './http';
import { nthingApi } from './nthingApi';

const mockFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

describe('nthingApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ token: 't', userId: 1, nickname: 'n', isNewUser: false });
  });

  it('loginKakao 는 POST /auth/kakao { code } 를 auth 없이 호출', async () => {
    await nthingApi.loginKakao('CODE');
    expect(mockFetch).toHaveBeenCalledWith('/auth/kakao', {
      method: 'POST',
      body: { code: 'CODE' },
      auth: false,
    });
  });

  it('loginNaver 는 POST /auth/naver { code, state }', async () => {
    await nthingApi.loginNaver('CODE', 'STATE');
    expect(mockFetch).toHaveBeenCalledWith('/auth/naver', {
      method: 'POST',
      body: { code: 'CODE', state: 'STATE' },
      auth: false,
    });
  });

  it('loginGoogle 는 POST /auth/google { code }', async () => {
    await nthingApi.loginGoogle('CODE');
    expect(mockFetch).toHaveBeenCalledWith('/auth/google', {
      method: 'POST',
      body: { code: 'CODE' },
      auth: false,
    });
  });

  it('loginApple 는 POST /auth/apple { idToken }', async () => {
    await nthingApi.loginApple('IDTOKEN');
    expect(mockFetch).toHaveBeenCalledWith('/auth/apple', {
      method: 'POST',
      body: { idToken: 'IDTOKEN' },
      auth: false,
    });
  });

  it('devLogin 은 POST /auth/dev-login (auth 없음)', async () => {
    await nthingApi.devLogin();
    expect(mockFetch).toHaveBeenCalledWith('/auth/dev-login', { method: 'POST', auth: false });
  });

  it('getMe 는 GET /users/me', async () => {
    mockFetch.mockResolvedValue({
      id: 1,
      nickname: 'n',
      profileImageUrl: null,
      createdAt: '2026-01-01T00:00:00',
    });
    await nthingApi.getMe();
    expect(mockFetch).toHaveBeenCalledWith('/users/me');
  });

  it('updateMe 는 PATCH /users/me { nickname }', async () => {
    mockFetch.mockResolvedValue({
      id: 1,
      nickname: 'x',
      profileImageUrl: null,
      createdAt: '2026-01-01T00:00:00',
    });
    await nthingApi.updateMe({ nickname: 'x' });
    expect(mockFetch).toHaveBeenCalledWith('/users/me', {
      method: 'PATCH',
      body: { nickname: 'x' },
    });
  });
});
