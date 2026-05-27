import { apiFetch } from './http';
import { type AuthResponse, type Me, type UpdateMeRequest } from './types';

export const nthingApi = {
  loginKakao: (code: string) =>
    apiFetch<AuthResponse>('/auth/kakao', { method: 'POST', body: { code }, auth: false }),

  loginNaver: (code: string, state: string) =>
    apiFetch<AuthResponse>('/auth/naver', { method: 'POST', body: { code, state }, auth: false }),

  loginGoogle: (code: string) =>
    apiFetch<AuthResponse>('/auth/google', { method: 'POST', body: { code }, auth: false }),

  loginApple: (idToken: string) =>
    apiFetch<AuthResponse>('/auth/apple', { method: 'POST', body: { idToken }, auth: false }),

  devLogin: () =>
    apiFetch<AuthResponse>('/auth/dev-login', { method: 'POST', auth: false }),

  getMe: () => apiFetch<Me>('/users/me'),

  updateMe: (req: UpdateMeRequest) =>
    apiFetch<Me>('/users/me', { method: 'PATCH', body: req }),
};
