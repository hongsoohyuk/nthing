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

describe('nthingApi splits/uploads', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ id: 1 });
  });

  it('getSplits 는 파라미터를 쿼리스트링으로 GET /splits', async () => {
    await nthingApi.getSplits({ lat: 37.5, lng: 127, radiusKm: 3, status: 'WAITING' });
    expect(mockFetch).toHaveBeenCalledWith('/splits?status=WAITING&lat=37.5&lng=127&radiusKm=3');
  });

  it('getSplits 는 빈 파라미터면 쿼리 없이 GET /splits', async () => {
    await nthingApi.getSplits();
    expect(mockFetch).toHaveBeenCalledWith('/splits');
  });

  it('getSplit 는 GET /splits/{id}', async () => {
    await nthingApi.getSplit(7);
    expect(mockFetch).toHaveBeenCalledWith('/splits/7');
  });

  it('createSplit 는 POST /splits (body)', async () => {
    const req = { productName: '두쫀쿠', totalPrice: 20000, totalQty: 4, splitCount: 2, latitude: 37.5, longitude: 127, address: '역삼동' };
    await nthingApi.createSplit(req);
    expect(mockFetch).toHaveBeenCalledWith('/splits', { method: 'POST', body: req });
  });

  it('joinSplit 는 POST /splits/{id}/join', async () => {
    await nthingApi.joinSplit(3);
    expect(mockFetch).toHaveBeenCalledWith('/splits/3/join', { method: 'POST' });
  });

  it('cancelSplit 는 PATCH /splits/{id}/cancel', async () => {
    await nthingApi.cancelSplit(3);
    expect(mockFetch).toHaveBeenCalledWith('/splits/3/cancel', { method: 'PATCH' });
  });

  it('getMySplits 는 GET /splits/my?page&size', async () => {
    await nthingApi.getMySplits();
    expect(mockFetch).toHaveBeenCalledWith('/splits/my?page=0&size=20');
  });

  it('getParticipatedSplits 는 GET /splits/participated?page&size', async () => {
    await nthingApi.getParticipatedSplits(2, 10);
    expect(mockFetch).toHaveBeenCalledWith('/splits/participated?page=2&size=10');
  });

  it('signUpload 는 POST /uploads/sign (body)', async () => {
    await nthingApi.signUpload({ contentType: 'image/jpeg', size: 123 });
    expect(mockFetch).toHaveBeenCalledWith('/uploads/sign', { method: 'POST', body: { contentType: 'image/jpeg', size: 123 } });
  });
});
