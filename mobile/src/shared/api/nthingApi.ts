import { apiFetch } from './http';
import {
  type AuthResponse,
  type CreateSplitRequest,
  type DeviceResponse,
  type GetSplitsParams,
  type Me,
  type PageResponse,
  type PresignRequest,
  type PresignResponse,
  type RegisterDeviceRequest,
  type Split,
  type UpdateMeRequest,
} from './types';

// undefined/'' 는 제외하고 쿼리스트링 조립 (0 은 포함)
function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const nthingApi = {
  // ── auth (Phase 1.3) ──
  loginKakao: (code: string) =>
    apiFetch<AuthResponse>('/auth/kakao', { method: 'POST', body: { code }, auth: false }),

  loginNaver: (code: string, state: string) =>
    apiFetch<AuthResponse>('/auth/naver', { method: 'POST', body: { code, state }, auth: false }),

  loginGoogle: (code: string) =>
    apiFetch<AuthResponse>('/auth/google', { method: 'POST', body: { code }, auth: false }),

  loginApple: (code: string, user?: string | null) =>
    apiFetch<AuthResponse>('/auth/apple', {
      method: 'POST',
      body: { code, user: user ?? undefined },
      auth: false,
    }),

  // iOS 네이티브 Sign in with Apple — identityToken 직접 검증
  loginAppleNative: (idToken: string) =>
    apiFetch<AuthResponse>('/auth/apple', { method: 'POST', body: { idToken }, auth: false }),

  devLogin: () => apiFetch<AuthResponse>('/auth/dev-login', { method: 'POST', auth: false }),

  // ── me (Phase 1.3) ──
  getMe: () => apiFetch<Me>('/users/me'),

  updateMe: (req: UpdateMeRequest) => apiFetch<Me>('/users/me', { method: 'PATCH', body: req }),

  // ── splits (Phase 1.4) ──
  // GET /splits, /splits/{id} 는 서버에서 비인증 허용(둘러보기). 토큰 있으면 함께 가도 무방.
  getSplits: (params: GetSplitsParams = {}) =>
    apiFetch<PageResponse<Split>>(
      `/splits${toQuery({
        status: params.status,
        lat: params.lat,
        lng: params.lng,
        radiusKm: params.radiusKm,
        page: params.page,
        size: params.size,
      })}`,
    ),

  getSplit: (id: number) => apiFetch<Split>(`/splits/${id}`),

  createSplit: (req: CreateSplitRequest) =>
    apiFetch<Split>('/splits', { method: 'POST', body: req }),

  joinSplit: (id: number) => apiFetch<Split>(`/splits/${id}/join`, { method: 'POST' }),

  cancelSplit: (id: number) => apiFetch<Split>(`/splits/${id}/cancel`, { method: 'PATCH' }),

  getMySplits: (page = 0, size = 20) =>
    apiFetch<PageResponse<Split>>(`/splits/my${toQuery({ page, size })}`),

  getParticipatedSplits: (page = 0, size = 20) =>
    apiFetch<PageResponse<Split>>(`/splits/participated${toQuery({ page, size })}`),

  // ── uploads (Phase 1.4 시그니처만; 실제 PUT 업로드는 1.5) ──
  signUpload: (req: PresignRequest) =>
    apiFetch<PresignResponse>('/uploads/sign', { method: 'POST', body: req }),

  // ── devices (Phase 2 push) ──
  registerDevice: (req: RegisterDeviceRequest) =>
    apiFetch<DeviceResponse>('/devices', { method: 'POST', body: req }),

  unregisterDevice: (fcmToken: string) =>
    apiFetch<void>('/devices/unregister', { method: 'POST', body: { fcmToken } }),
};
